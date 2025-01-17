import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/search.post" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user.js";
import { body } from "express-validator";
import { hasErrors } from "../../../utils/api.js";
import { Redis } from "../../../singleton/redis.js";
import { Configuration } from "../../../singleton/configuration.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { isValidObjectId } from "mongoose";
import { hydrateUserProfile, isFollowing, stripSensitiveFieldsForNonFollowerGet } from "../../../utils/user.js";
import BlockModel from "../../../model/mongo/block.js";

export const POST_SearchValidator = [body("query").exists().isString().isLength({ max: 128 })];

const filterBlockedUsers = async (loggedInUserId: string, results: UserInterface[]) => {
  const blockedUsers: { sourceId: any; targetId: any }[] = await BlockModel.find(
    { targetId: loggedInUserId, sourceId: { $in: results.map((user) => user._id) } },
    { sourceId: 1 },
  );
  const blockedUserIds = blockedUsers.map((user) => user.sourceId.toString());
  log.debug("Blocked users: %o for search from user %s", blockedUserIds, loggedInUserId);
  const filteredResults = results.filter((user) => !blockedUserIds.includes(user._id.toString()));
  return filteredResults;
};

const redisPrefix = "search:";
const POST_Search = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:search", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const loggedInUserId = res.locals.oauth.token.user._id;
    const query = req.body.query;
    const startTime = +new Date();
    console.log(Redis);
    let cacheResults: any = await Redis.get(`${redisPrefix}${query}`);
    if (cacheResults) {
      cacheResults = JSON.parse(cacheResults);
      const filteredResults = await filterBlockedUsers(loggedInUserId, cacheResults);
      res.status(statusCodes.success).json(new SuccessResponse({ results: filteredResults }));
      return;
    }
    log.info("Cache miss for query: " + query);
    const queryRegex = new RegExp(query, "i");
    const strictFields = new Set(Configuration.get("user.search.strict-match-fields"));
    const $or = Configuration.get("user.search.search-fields").map((field: string) => ({
      [field]: strictFields.has(field) ? query : queryRegex,
    }));
    if (Configuration.get("privilege.user.search.can-use-id") && isValidObjectId(query)) {
      log.debug("Search by ID is enabled.");
      $or.push({ _id: query });
    }
    if (Configuration.get("privilege.user.search.can-use-fullname")) {
      log.debug("Search by Full Name is enabled.");
      $or.push({
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: query,
            options: "i",
          },
        },
      });
    }
    log.debug("Search query is: %o", $or);
    const results = (await UserModel.find({ $or }, UserProjection).limit(
      Configuration.get("user.search-results.limit"),
    )) as unknown as UserInterface[];
    await hydrateUserProfile(results);
    const cacheKey = `${redisPrefix}${query}`;
    const cacheValue = JSON.stringify(results);
    const cacheExpiry = Configuration.get("user.search-results.cache-lifetime");
    await Redis.setEx(cacheKey, cacheValue, cacheExpiry);
    const milliseconds = +new Date() - startTime;
    log.info("Search for query `%s` completed in %s ms", query, milliseconds);
    const filteredResults = await filterBlockedUsers(loggedInUserId, results);
    const { negativeIndices } = await isFollowing({ sourceId: loggedInUserId, targets: filteredResults });
    for (let i = 0; i < negativeIndices.length; i++) {
      const index = negativeIndices[i];
      stripSensitiveFieldsForNonFollowerGet(filteredResults[index]);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ results: filteredResults }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Search;

