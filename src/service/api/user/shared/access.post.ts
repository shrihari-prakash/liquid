import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/access.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { hasErrors } from "../../../../utils/api.js";
import UserModel from "../../../../model/mongo/user.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import ClientModel from "../../../../model/mongo/client.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/oauth.js";

const Operations = {
  ADD: "add",
  DEL: "del",
  SET: "set",
};

export const POST_AccessValidator = [
  body("targets").exists().isArray(),
  body("targetType").exists().isString().isIn(["user", "client"]),
  body("scope").exists().isArray(),
  body("operation").exists().isString().isIn(Object.values(Operations)),
];

const POST_Access = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:access:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    if (req.body.targets.some((t: string) => typeof t !== "string" || !isValidObjectId(t))) {
      const errors = [
        {
          msg: "Invalid value",
          param: "targets",
          location: "body",
        },
      ];
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    if (
      req.body.scope.some(
        (s: string) =>
          /* 
          Scope validate error conditions:
            1. If a scope value is not string.
            2. If it is not a valid scope from the list of scopes.
            3. If the user requesting the API does not have access to this scope in the first place
          */
          typeof s !== "string" ||
          typeof ScopeManager.getScopes()[s] === "undefined" ||
          !ScopeManager.isScopeAllowed(s, res.locals.oauth.token.scope)
      )
    ) {
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
    log.info(
      "Executing operation '%s' for access list '%o' on targets '%o'. Source user: %s",
      req.body.operation,
      req.body.scope,
      req.body.targets,
      res.locals.oauth.token.user._id
    );
    let query: any = null;
    switch (req.body.operation) {
      case Operations.ADD:
        query = {
          $addToSet: {
            scope: { $each: req.body.scope },
          },
        };
        break;
      case Operations.DEL:
        query = {
          $pull: {
            scope: { $in: req.body.scope },
          },
        };
        break;
      case Operations.SET:
        query = {
          $set: {
            scope: req.body.scope,
          },
        };
    }
    const model = req.body.targetType === "user" ? UserModel : ClientModel;
    await model.updateMany({ _id: { $in: req.body.targets } }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(req.body.targets);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Access;
