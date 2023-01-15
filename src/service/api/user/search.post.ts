import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/search" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUserProjection } from "../../../model/mongo/user";
import { body } from "express-validator";
import { validateErrors } from "../../../utils/api";
import { Redis } from "../../../singleton/redis";
import { Configuration } from "../../../singleton/configuration";

export const POST_SearchValidator = [
  body("query").exists().isString().isLength({ max: 128 }),
];

const redisPrefix = "SEARCH_";
const POST_Search = async (req: Request, res: Response) => {
  validateErrors(req, res);
  try {
    const query = req.body.query;
    if (Configuration.get("privilege.can-use-cache")) {
      const cacheResults = await Redis.client.get(`${redisPrefix}${query}`);
      if (cacheResults) {
        return res
          .status(statusCodes.success)
          .json(new SuccessResponse({ results: JSON.parse(cacheResults) }));
      }
    }
    log.info("Cache miss for query: " + query);
    const queryRegex = new RegExp(query, "i");
    const results = await UserModel.find(
      {
        $or: [
          { username: queryRegex },
          { firstName: queryRegex },
          { lastName: queryRegex },
        ],
      },
      IUserProjection
    );
    if (Configuration.get("privilege.can-use-cache")) {
      await Redis.client.set(
        `${redisPrefix}${query}`,
        JSON.stringify(results),
        "EX",
        Configuration.get("user.search-results.cache-lifetime") as number
      );
    }
    res.status(statusCodes.success).json(new SuccessResponse({ results }));
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Search;
