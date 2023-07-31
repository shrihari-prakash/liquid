import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "scope-manager" });

import Scopes from "./scopes.json";

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
      log.debug("Scope not allowed for %s. Searching in parent scope %s.", scopeObject.name, scopeObject.parent);
      return this.isScopeAllowed(scopeObject.parent, allowedScopes);
    } else {
      return false;
    }
  }
}
