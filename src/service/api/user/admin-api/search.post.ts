import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/admin-api/search.post" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel, { UserInterface, UserProjection } from "../../../../model/mongo/user.js";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api.js";
import { Redis } from "../../../../singleton/redis.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { isValidObjectId } from "mongoose";
import { hydrateUserProfile } from "../../../../utils/user.js";

export const POST_SearchValidator = [body("query").exists().isString().isLength({ max: 128 })];

const redisPrefix = "search:";
const POST_Search = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:profile:search", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const query = req.body.query;
    const startTime = +new Date();
    let cacheResults: any = await Redis.get(`${redisPrefix}${query}`);
    if (cacheResults) {
      cacheResults = JSON.parse(cacheResults);
      res.status(statusCodes.success).json(new SuccessResponse({ results: cacheResults }));
      return;
    }
    log.info("Cache miss for query: " + query);
    const queryRegex = new RegExp(query, "i");
    log.debug("Admin search fields: %o", Configuration.get("admin-api.user.search.search-fields"));
    const $or = Configuration.get("admin-api.user.search.search-fields").map((field: string) => ({ [field]: queryRegex }));
    if (Configuration.get("admin-api.privilege.user.search.can-use-id") && isValidObjectId(query)) {
      log.debug("Search by ID is enabled.");
      $or.push({ _id: query });
    }
    if (Configuration.get("admin-api.privilege.user.search.can-use-fullname")) {
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
      Configuration.get("admin-api.user.search-results.limit")
    )) as unknown as UserInterface[];
    await hydrateUserProfile(results);
    const cacheKey = `${redisPrefix}${query}`;
    const cacheValue = JSON.stringify(results);
    const cacheExpiry = Configuration.get("admin-api.user.search-results.cache-lifetime");
    await Redis.setEx(cacheKey, cacheValue, cacheExpiry);
    const milliseconds = +new Date() - startTime;
    log.info("Search for query `%s` completed in %s ms", query, milliseconds);
    res.status(statusCodes.success).json(new SuccessResponse({ results: results }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Search;
