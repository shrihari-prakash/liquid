import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "scope-manager" });

import { Response } from "express";
import fs from "fs";

import Scopes from "./scopes.json" assert { type: "json" };
import { errorMessages, statusCodes } from "../../utils/http-status.js";
import { ErrorResponse } from "../../utils/response.js";
import { Configuration } from "../../singleton/configuration.js";
import { Role } from "../../singleton/role.js";

interface Scope {
  name: string;
  description: string;
  parent?: string;
}

export class ScopeManager {
  scopes: any;
  constructor() {
    const startTime = +new Date();
    log.debug("Initializing scopes...");
    let scopes = Scopes;
    const scopeExtensionsPath = Configuration.get("system.scope-extension-file-path");
    if (fs.existsSync(scopeExtensionsPath)) {
      try {
        log.debug("Scope extensions detected, extending system scopes...");
        const extendedScopes = JSON.parse(fs.readFileSync(scopeExtensionsPath, "utf8"));
        scopes = [...Scopes, ...extendedScopes];
      } catch (e) {
        log.error("Error parsing scope extensions.");
        log.error(e);
      }
    } else {
      log.debug("No scope extensions detected.");
    }
    log.debug(this.getScopeTree(scopes));
    this.scopes = scopes.reduce((scopes, scope) => Object.assign(scopes, { [scope.name]: scope }), {});
    const milliseconds = +new Date() - startTime;
    log.info("Scopes initialized in %s ms", milliseconds);
  }

  getScopeTree(scopes: Scope[], root: string | null | undefined = null) {
    return Object.fromEntries(
      scopes.filter((scope) => scope.parent == root).map((s): any => [s.name, this.getScopeTree(scopes, s.name)]),
    );
  }

  getScopes() {
    return this.scopes;
  }

  isScopeAllowedForSharedSession(scope: string, res: Response) {
    const token = res.locals?.oauth?.token;
    const allowedScopes = token?.scope || [];
    const clientAllowedScopes = token?.client.scope || [];
    const role = token?.user?.role;
    const isAllowedForClient = this.isScopeAllowed(scope.replace("<ENTITY>", "client"), allowedScopes);
    log.debug(
      "Shared session scope check. Scopes allowed: %o, client scopes allowed: %o.",
      allowedScopes,
      clientAllowedScopes,
    );
    /* When checking permissions for a user, also check if the same permission is allowed for the client
    that the user is having a session with. Many times, it might be possible that the user has elevated permissions,
    but the client is not granted those permissions. This is especially the case with third party connected apps. */
    const isAllowedForUser =
      (this.isScopeAllowed(scope.replace("<ENTITY>", "admin"), allowedScopes) &&
        this.isScopeAllowed(scope.replace("<ENTITY>", "admin"), clientAllowedScopes)) ||
      role === Role.SystemRoles.SUPER_ADMIN;
    if (!isAllowedForUser && !isAllowedForClient) {
      log.debug("Scope blocked for user %s, client %s.", token?.user?.username, token?.client?.id);
      res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
      return false;
    } else {
      return true;
    }
  }

  isScopeAllowedForSession(scope: string, res: Response) {
    const token = res.locals?.oauth?.token;
    const allowedScopes = token?.scope || [];
    const clientAllowedScopes = token?.client.scope || [];
    log.debug("Scopes allowed: %o, client scopes allowed: %o", allowedScopes, clientAllowedScopes);
    if (this.isScopeAllowed(scope, allowedScopes) && this.isScopeAllowed(scope, clientAllowedScopes)) {
      return true;
    } else {
      log.debug("Scope blocked for user %s, client %s.", token?.user?.username, token?.client?.id);
      res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
      return false;
    }
  }

  canRequestScope(scopes: string[], entity: any) {
    if (!scopes) {
      log.debug("Scope not specified %s", scopes);
      return false;
    }
    let allowedScopes = entity.scope || [];
    if (entity.role) {
      allowedScopes = [...allowedScopes, Role.getRoleScopes(entity.role)];
    }
    return scopes.every((requestedScope: string) => this.isScopeAllowed(requestedScope, allowedScopes));
  }

  isScopeAllowed(scope: string, allowedScopes: string[] = []): boolean {
    const scopeObject = this.scopes[scope];
    if (!scopeObject) {
      log.debug("No scope object found for %s", scope);
      return false;
    }
    if (allowedScopes.includes(scopeObject.name) || allowedScopes.includes(scopeObject.parent)) {
      return true;
    } else if (scopeObject.parent) {
      return this.isScopeAllowed(scopeObject.parent, allowedScopes);
    } else {
      return false;
    }
  }
}

