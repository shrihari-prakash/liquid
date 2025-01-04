import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-redis-adapter" });

import { AuthorizationCode, RefreshToken, Token } from "@node-oauth/oauth2-server";
import { Redis } from "../../../singleton/redis.js";
import { RedisPrefixes } from "../../../enum/redis.js";
import { Configuration } from "../../../singleton/configuration.js";
import { isApplicationClient } from "../utils.js";
import { getUserInfo } from "../cache.js";
import { isTokenInvalidated } from "../../../utils/session.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { isRoleInvalidated } from "../../../utils/role.js";
import { Role } from "../../../singleton/role.js";

class RedisAdapter {
  getPrefixedToken(token: string) {
    return `${RedisPrefixes.TOKEN}${token}`;
  }

  getPrefixedCode(code: string) {
    return `${RedisPrefixes.CODE}${code}`;
  }

  async saveToken(token: Token) {
    token.registeredAt = new Date().toISOString();
    const serialized = JSON.stringify(token);
    await Redis.setEx(
      this.getPrefixedToken(token.accessToken),
      serialized,
      Configuration.get("oauth.access-token-lifetime") as number,
    );
    if (token.refreshToken)
      await Redis.setEx(
        this.getPrefixedToken(token.refreshToken),
        serialized,
        Configuration.get("oauth.refresh-token-lifetime") as number,
      );
    return token;
  }

  async checkToken(token: any) {
    if (!token) return null;
    token = JSON.parse(token);
    if (!isApplicationClient(token.user)) {
      token.user = await getUserInfo(token.user._id);
    }
    const globalLogoutAt = token.user.globalLogoutAt;
    const tokenRegisteredAt = token.registeredAt;
    if (await isRoleInvalidated(token.user.role, tokenRegisteredAt as Date)) {
      log.debug("Expired token detected. Reason: Role invalidated.");
      return null;
    }
    if (isTokenInvalidated(globalLogoutAt, tokenRegisteredAt)) {
      log.debug("Expired token detected. Reason: Token invalidated.");
      return null;
    }
    const hasNegativeScopeDiff = token.scope.some((scope: string) => {
      const roleObject = Role.getRole(token.user.role);
      const roleScopeAllowed = !ScopeManager.isScopeAllowed(scope, roleObject?.scope || []);
      const userScopeAllowed = !ScopeManager.isScopeAllowed(scope, token.user.scope);
      return roleScopeAllowed && userScopeAllowed;
    });
    if (hasNegativeScopeDiff) {
      log.debug(
        "Some scopes were revoked for user %s since last token grant. Token/Role has been invalidated.",
        token.user.username,
      );
      return null;
    }
    if (token.accessTokenExpiresAt) {
      token.accessTokenExpiresAt = new Date(token.accessTokenExpiresAt);
    }
    if (token.refreshTokenExpiresAt) {
      token.refreshTokenExpiresAt = new Date(token.refreshTokenExpiresAt);
    }
    return token;
  }

  async getAccessToken(accessToken: string) {
    log.debug("Checking access token: %s", accessToken);
    let cacheToken: any = await Redis.get(this.getPrefixedToken(accessToken));
    return this.checkToken(cacheToken);
  }

  async getRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
    log.debug("Checking refresh token: %s", refreshToken);
    let cacheToken: any = await Redis.get(this.getPrefixedToken(refreshToken));
    return this.checkToken(cacheToken);
  }

  async revokeToken(token: RefreshToken) {
    if (token.refreshToken) {
      await Redis.del(this.getPrefixedToken(token.refreshToken));
    }
    if (token.accessToken) {
      await Redis.del(this.getPrefixedToken(token.accessToken));
    }
    return true;
  }

  async saveAuthorizationCode(authorizationCode: AuthorizationCode) {
    await Redis.setEx(
      this.getPrefixedCode(authorizationCode.authorizationCode),
      JSON.stringify(authorizationCode),
      Configuration.get("oauth.authorization-code-lifetime") as number,
    );
    return authorizationCode;
  }

  async getAuthorizationCode(authorizationCode: string) {
    let cacheCode: any = (await Redis.get(this.getPrefixedCode(authorizationCode))) as string;
    if (!cacheCode) return null;
    cacheCode = JSON.parse(cacheCode) as AuthorizationCode;
    cacheCode.expiresAt = new Date(cacheCode.expiresAt);
    return cacheCode;
  }

  async revokeAuthorizationCode(authorizationCode: string) {
    await Redis.del(this.getPrefixedCode(authorizationCode));
    return true;
  }
}

export default new RedisAdapter() as RedisAdapter;

