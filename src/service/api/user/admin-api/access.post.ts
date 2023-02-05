import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/access" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { validateErrors } from "../../../../utils/api";
import UserModel from "../../../../model/mongo/user";

export const POST_AccessValidator = [
  body("targets").exists().isArray(),
  body("permissions").exists().isArray(),
  body("status").exists().isBoolean(),
];

const POST_Access = async (req: Request, res: Response) => {
  validateErrors(req, res);
  try {
    if (
      req.body.targets.some((t: string) => typeof t !== "string") ||
      req.body.permissions.some((p: string) => typeof p !== "string")
    ) {
      const errors = [
        {
          msg: "Invalid value",
          param: null,
          location: "body",
        },
      ];
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    let action = "$addToSet";
    let arraycondition = "$each";
    if (req.body.status === false) {
      action = "$pull";
      arraycondition = "$in";
    }
    await UserModel.updateMany(
      { _id: { $in: req.body.targets } },
      {
        [action]: {
          allowedAdminAPIs: { [arraycondition]: req.body.permissions },
        },
      }
    );
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
  res.status(statusCodes.success).json(new SuccessResponse());
};

export default POST_Access;
