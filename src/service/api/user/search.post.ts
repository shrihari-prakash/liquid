import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/search.post" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user";
import { body } from "express-validator";
import { hasErrors } from "../../../utils/api";
import { Redis } from "../../../singleton/redis";
import { Configuration } from "../../../singleton/configuration";
import { ScopeManager } from "../../../singleton/scope-manager";
import { isValidObjectId } from "mongoose";
import { hydrateUserProfile } from "../../../utils/user";

export const POST_SearchValidator = [body("query").exists().isString().isLength({ max: 128 })];

const redisPrefix = "search:";
const POST_Search = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:search", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const query = req.body.query;
    const startTime = +new Date();
    console.log(Redis);
    const cacheResults = await Redis.get(`${redisPrefix}${query}`);
    if (cacheResults) {
      return res.status(statusCodes.success).json(new SuccessResponse({ results: JSON.parse(cacheResults) }));
    }
    log.info("Cache miss for query: " + query);
    const queryRegex = new RegExp(query, "i");
    const $or = Configuration.get("user.search.search-fields").map((field: string) => ({ [field]: queryRegex }));
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
      Configuration.get("user.search-results.limit")
    )) as unknown as UserInterface[];
    await hydrateUserProfile(results);
    const cacheKey = `${redisPrefix}${query}`;
    const cacheValue = JSON.stringify(results);
    const cacheExpiry = Configuration.get("user.search-results.cache-lifetime");
    await Redis.setEx(cacheKey, cacheValue, cacheExpiry);
    const milliseconds = +new Date() - startTime;
    log.info("Search for query `%s` completed in %s ms", query, milliseconds);
    res.status(statusCodes.success).json(new SuccessResponse({ results }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Search;
