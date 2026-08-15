import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "client/admin-api/create.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import ClientModel from "../../../../model/mongo/client.js";
import { hasErrors } from "../../../../utils/api.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { CORS } from "../../../../singleton/cors.js";
import { Role } from "../../../../singleton/role.js";
import { OAuthGrant } from "../../../../enum/oauth-grant.js";

export const POST_CreateValidator = [
  body("id")
    .exists()
    .isString()
    .isLength({ min: 8, max: 30 })
    .matches(new RegExp(Configuration.get("client.id-validation-regex"), "i")),
  body("grants").exists().isArray().isIn(Object.values(OAuthGrant)),
  body("redirectUris").exists().isArray(),
  body("isPublic").optional().isBoolean(),
  body("secret").custom((value, { req }) => {
    if (!req.body.isPublic && (!value || typeof value !== "string" || value.length < 8 || value.length > 256)) {
      throw new Error("Secret is required for confidential clients");
    }
    return true;
  }),
  body("role").exists().isString().isIn([Role.SystemRoles.INTERNAL_CLIENT, Role.SystemRoles.EXTERNAL_CLIENT]),
  body("scope").optional().isArray().isIn(Object.keys(ScopeManager.getScopes())),
  body("displayName").exists().isString().isLength({ min: 8, max: 96 }),
];

const POST_Create = async (req: Request, res: Response): Promise<void> => {
  try {
    if (hasErrors(req, res)) return;
    const requiredScope =
      req.body.role === Role.SystemRoles.INTERNAL_CLIENT
        ? "admin:system:internal-client:write"
        : "admin:system:external-client:write";
    if (!ScopeManager.isScopeAllowedForSession(requiredScope, res)) {
      return;
    }
    const isPublic = Boolean(req.body.isPublic);
    const grants = isPublic && Array.isArray(req.body.grants)
      ? req.body.grants.filter((g: string) => g !== OAuthGrant.CLIENT_CREDENTIALS)
      : req.body.grants;
    const client = {
      id: req.body.id,
      grants: grants,
      redirectUris: req.body.redirectUris,
      isPublic: isPublic,
      secret: isPublic ? undefined : req.body.secret,
      role: req.body.role,
      scope: req.body.scope || [],
      displayName: req.body.displayName,
    };
    const inserted = await new ClientModel(client).save();
    log.debug("Client created successfully.");
    log.debug(inserted);
    res.status(statusCodes.success).json(new SuccessResponse({ client: inserted }));
    CORS.scanOrigins();
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;

