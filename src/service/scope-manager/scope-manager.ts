import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "scope-manager" });

import { Response } from "express";

import Scopes from "./scopes.json";
import { errorMessages, statusCodes } from "../../utils/http-status";
import { ErrorResponse } from "../../utils/response";

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
    log.debug(this.getScopeTree(Scopes));
    this.scopes = Scopes.reduce((scopes, scope) => Object.assign(scopes, { [scope.name]: scope }), {});
    const milliseconds = +new Date() - startTime;
    log.info("Scopes initialized in %s ms", milliseconds);
  }

  getScopeTree(scopes: Scope[], root: string | null | undefined = null) {
    return Object.fromEntries(
      scopes.filter((scope) => scope.parent == root).map((s): any => [s.name, this.getScopeTree(scopes, s.name)])
    );
  }

  getScopes() {
    return this.scopes;
  }

  isScopeAllowedForSharedSession(scope: string, res: Response) {
    return this.isScopeAllowedForSession(scope.replace("<ENTITY>", "client"), res)
      || this.isScopeAllowedForSession(scope.replace("<ENTITY>", "admin"), res)
  }

  isScopeAllowedForSession(scope: string, res: Response) {
    const allowedScopes = res.locals?.oauth?.token?.scope || "";
    if (this.isScopeAllowed(scope, allowedScopes)) {
      return true;
    } else {
      res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
      return false;
    }
  }

  canRequestScope(scopes: any, entity: any) {
    if (scopes) {
      scopes = scopes.split(",");
    } else {
      log.debug("Scope not specified %s", scopes);
      return false;
    }
    return scopes.every((requestedScope: string) => this.isScopeAllowed(requestedScope, entity.scope));
  }

  isScopeAllowed(scope: string, allowedScopes: string): boolean {
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
