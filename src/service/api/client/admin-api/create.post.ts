import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client/admin-api/create" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { ScopeManager } from "../../../../singleton/scope-manager";
import Role from "../../../../enum/role";
import ClientModel from "../../../../model/mongo/client";
import { hasErrors } from "../../../../utils/api";
import { Configuration } from "../../../../singleton/configuration";

export const POST_CreateValidator = [
  body("id").exists().isString().isLength({ min: 8, max: 30 }).matches(new RegExp(Configuration.get("client.id-validation-regex"), "i")),
  body("grants").exists().isArray().isIn(["client_credentials", "authorization_code", "refresh_token", "password"]),
  body("redirectUris").exists().isArray(),
  body("secret").exists().isString().isLength({ min: 8, max: 256 }),
  body("role").exists().isString().isIn([Role.INTERNAL_CLIENT, Role.EXTERNAL_CLIENT]),
  body("scope").optional().isArray().isIn(Object.keys(ScopeManager.getScopes())),
  body("displayName").exists().isString().isLength({ min: 8, max: 96 }),
];

const POST_Create = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const requiredScope = req.body.role === Role.INTERNAL_CLIENT ? "admin:system:internal-client:write" : "admin:system:external-client:write"
    if (!ScopeManager.isScopeAllowedForSession(requiredScope, res)) {
      return;
    }
    const client = {
      id: req.body.id,
      grants: req.body.grants,
      redirectUris: req.body.redirectUris,
      secret: req.body.secret,
      role: req.body.role,
      scope: req.body.scope || [],
      displayName: req.body.displayName,
    };
    const inserted = await new ClientModel(client).save();
    log.debug("Client created successfully.");
    log.debug(inserted);
    res.status(statusCodes.success).json(new SuccessResponse({ client: inserted }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
