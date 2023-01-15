import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/followers" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUserProjection } from "../../../model/mongo/user";
import { body } from "express-validator";
import { validateErrors } from "../../../utils/api";

export const POST_SearchValidator = [
  body("query").exists().isString().isLength({ max: 128 }),
];

const POST_Search = async (req: Request, res: Response) => {
  validateErrors(req, res);
  try {
    const query = req.body.query;
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
    res.status(statusCodes.success).json(new SuccessResponse({ results }));
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Search;
