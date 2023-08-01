import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/access" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { hasErrors } from "../../../../utils/api";
import UserModel from "../../../../model/mongo/user";
import { ScopeManager } from "../../../../singleton/scope-manager";
import ClientModel from "../../../../model/mongo/client";

export const POST_AccessValidator = [
  body("targets").exists().isArray().isLength({ min: 8 }),
  body("targetType").exists().isString().isIn(['user', 'client']),
  body("scope").exists().isArray().isLength({ min: 1, max: 128 }),
  body("status").exists().isBoolean(),
];

const POST_Access = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.admin.access.write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    if (
      req.body.targets.some((t: string) => typeof t !== "string") ||
      req.body.scope.some((s: string) => typeof s !== "string")
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
    if (req.body.scope.some((s: string) => typeof ScopeManager.getScopes()[s] === "undefined")) {
      const errors = [
        {
          msg: "Invalid value",
          param: "scope",
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
    const model = req.body.targetType === "user" ? UserModel : ClientModel;
    await model.updateMany(
      { _id: { $in: req.body.targets } },
      {
        [action]: {
          scope: { [arraycondition]: req.body.scope },
        },
      }
    );
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Access;
