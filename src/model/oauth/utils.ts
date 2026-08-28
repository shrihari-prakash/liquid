import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-utils" });

import { Role } from "../../singleton/role.js";
import { ScopeManager } from "../../singleton/scope-manager.js";
import { Configuration } from "../../singleton/configuration.js";
import { isRoleInvalidated } from "../../utils/role.js";

export const isApplicationClient = (user: any) => {
  if (!user || typeof user !== "object") {
    return false;
  }
  const appplicationClient =
    user.role === Role.SystemRoles.INTERNAL_CLIENT || user.role === Role.SystemRoles.EXTERNAL_CLIENT;
  return appplicationClient;
};

export const validateAccessTokenScopes = async (
  token: any,
  user: any,
  tokenRegisteredAt?: Date | string,
): Promise<boolean> => {
  if (tokenRegisteredAt && (await isRoleInvalidated(user.role, tokenRegisteredAt as Date))) {
    log.debug("Expired token detected. Reason: Role invalidated.");
    return false;
  }
  const hasNegativeScopeDiff = ((token.scope as string[]) || []).some((scope: string) => {
    const roleObject = Role.getRole(user.role);
    const roleScopeAllowed = !ScopeManager.isScopeAllowed(scope, roleObject?.scope || []);
    const userScopeAllowed = !ScopeManager.isScopeAllowed(scope, user.scope);
    return roleScopeAllowed && userScopeAllowed;
  });
  if (hasNegativeScopeDiff) {
    log.debug(
      "Some scopes were revoked for user %s since last token grant. Token/Role has been invalidated.",
      user.username,
    );
    return false;
  }
  return true;
};

export const recalculateRefreshTokenScopes = (
  token: any,
  user: any,
  client: any,
): string[] => {
  if (!user.scope) {
    user.scope = Configuration.get("user.account-creation.default-scope");
  }
  if (client?.role === Role.SystemRoles.INTERNAL_CLIENT) {
    const userRoleScopes = Role.getRoleScopes(user.role);
    const recalculated = Array.from(new Set([...(user.scope || []), ...userRoleScopes]));
    log.debug(
      "Recalculated all allowed scopes (%o) for user %s on refresh token from internal client",
      recalculated,
      user.username,
    );
    return recalculated;
  }
  const roleObject = Role.getRole(user.role);
  const allowedRoleScopes = roleObject?.scope || [];
  const allowedUserScopes = user.scope || [];
  const clientScopes = Array.isArray(client?.scope) ? client.scope : client?.scope ? [client.scope] : [];
  return ((token.scope as string[]) || []).filter((scope: string) => {
    const userHasScope =
      ScopeManager.isScopeAllowed(scope, allowedRoleScopes) ||
      ScopeManager.isScopeAllowed(scope, allowedUserScopes);
    const clientHasScope = !client?.scope || ScopeManager.isScopeAllowed(scope, clientScopes);
    return userHasScope && clientHasScope;
  });
};
