import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/search" });

import { Request, Response } from "express";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel, { UserInterface, UserProjection } from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";
import { Redis } from "../../../../singleton/redis.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { hydrateUserProfile, isFollowing, stripSensitiveFieldsForNonFollowerGet } from "../../../../utils/user.js";
import BlockModel from "../../../../model/mongo/block.js";
import { QueryParser } from "../../../query-parser/query-parser.js";
import { isValidObjectId } from "mongoose";

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

const constructQuickSearchQuery = (query: string, baseConfigPrefix: string, privilegePrefix: string) => {
  const queryRegex = new RegExp(query, "i");
  const strictFields = new Set(Configuration.get(`${baseConfigPrefix}.search.strict-match-fields`));
  const $or: any[] = Configuration.get(`${baseConfigPrefix}.search.search-fields`).map((field: string) => ({
    [field]: strictFields.has(field) ? query : queryRegex,
  }));
  if (Configuration.get(`${privilegePrefix}.search.can-use-id`) && isValidObjectId(query)) {
    log.debug("Search by ID is enabled.");
    $or.push({ _id: query });
  }
  if (Configuration.get(`${privilegePrefix}.search.can-use-fullname`)) {
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
  return { $or };
};

const redisPrefix = "search:";

interface SearchOptions {
  scope: string;
  baseConfigPrefix: string;
  privilegePrefix: string;
  filterBlocked: boolean;
}

export const runSearch = async (req: Request, res: Response, options: SearchOptions): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession(options.scope, res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const loggedInUserId = res.locals.oauth.token.user._id;
    const query = req.body.query;
    const startTime = +new Date();

    let cacheResults: any = await Redis.get(`${redisPrefix}${JSON.stringify(query)}`);
    if (cacheResults) {
      cacheResults = JSON.parse(cacheResults);
      let filteredResults = cacheResults;
      if (options.filterBlocked) {
        filteredResults = await filterBlockedUsers(loggedInUserId, filteredResults);
      }
      res.status(statusCodes.success).json(new SuccessResponse({ results: filteredResults }));
      return;
    }
    log.info("Cache miss for query: " + JSON.stringify(query));

    let mongoQuery: any = {};
    let cacheKeyQuery = "";

    if (typeof query === "object") {
      const allowedFields = new Set<string>(Configuration.get(`${options.baseConfigPrefix}.search.search-fields`));
      if (!QueryParser.validate(query, allowedFields)) {
        res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
        return;
      }
      mongoQuery = query;
      cacheKeyQuery = JSON.stringify(query);
    } else {
      mongoQuery = constructQuickSearchQuery(query, options.baseConfigPrefix, options.privilegePrefix);
      cacheKeyQuery = JSON.stringify(query);
    }

    log.debug("Search query is: %o", mongoQuery);
    const results = (await UserModel.find(mongoQuery, UserProjection).limit(
      Configuration.get(`${options.baseConfigPrefix}.search-results.limit`),
    )) as unknown as UserInterface[];

    await hydrateUserProfile(results);

    const cacheKey = `${redisPrefix}${cacheKeyQuery}`;
    const cacheValue = JSON.stringify(results);
    const cacheExpiry = Configuration.get(`${options.baseConfigPrefix}.search-results.cache-lifetime`);
    await Redis.setEx(cacheKey, cacheValue, cacheExpiry);
    const milliseconds = +new Date() - startTime;

    log.info("Search for query `%s` completed in %s ms", JSON.stringify(query), milliseconds);

    let filteredResults = results;
    if (options.filterBlocked) {
      filteredResults = await filterBlockedUsers(loggedInUserId, results);
      const { negativeIndices } = await isFollowing({ sourceId: loggedInUserId, targets: filteredResults });
      for (let i = 0; i < negativeIndices.length; i++) {
        const index = negativeIndices[i];
        stripSensitiveFieldsForNonFollowerGet(filteredResults[index]);
      }
    }

    res.status(statusCodes.success).json(new SuccessResponse({ results: filteredResults }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

