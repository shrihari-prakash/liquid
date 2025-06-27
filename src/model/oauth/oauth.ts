import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-model" });

import { AuthorizationCode, Falsey, Token, RefreshToken } from "@node-oauth/oauth2-server";

import { Configuration } from "../../singleton/configuration.js";
import { ClientInterface } from "../mongo/client.js";
import { UserInterface } from "../mongo/user.js";
import { ScopeManager } from "../../singleton/scope-manager.js";
import { Role } from "../../singleton/role.js";
import { isApplicationClient } from "./utils.js";
import MongoAdapter from "./adapters/mongo-adapter.js";
import RedisAdapter from "./adapters/redis-adapter.js";

interface User {
  [key: string]: any;
}

const useTokenCache = (): boolean => {
  return Configuration.get("privilege.can-use-cache");
};

const OAuthModel = {
  getClient: MongoAdapter.getClient,

  getUserFromClient: (client: ClientInterface) => {
    return new Promise<User>((resolve) => {
      // There is no notion of users in client_credentials grant.
      // So we simply return the client id for the username.
      // See more here: https://github.com/node-oauth/node-oauth2-server/issues/71#issuecomment-1181515928
      resolve({ _id: client._id, username: client.id, role: client.role, scope: client.scope });
    });
  },

  saveToken: async (token: Token, client: ClientInterface, user: User) => {
    try {
      token.client = client;
      if (!isApplicationClient(user)) {
        // No need to store the full user as _id is resolved to full object while retrieving from cache/db.
        token.user = { _id: user._id };
      } else {
        token.user = user;
      }
      if (useTokenCache()) {
        return await RedisAdapter.saveToken(token);
      } else {
        return await MongoAdapter.saveToken(token);
      }
    } catch (err) {
      log.error("Error saving token:");
      log.error(err);
      throw err;
    }
  },

  getAccessToken: async (accessToken: string) => {
    try {
      if (useTokenCache()) {
        return await RedisAdapter.getAccessToken(accessToken);
      } else {
        return await MongoAdapter.getAccessToken(accessToken);
      }
    } catch (err) {
      log.error("Error retrieving access token:");
      log.error(err);
      throw err;
    }
  },

  getRefreshToken: async (refreshToken: string) => {
    if (useTokenCache()) {
      return await RedisAdapter.getRefreshToken(refreshToken);
    } else {
      return await MongoAdapter.getRefreshToken(refreshToken);
    }
  },

  revokeToken: async (token: RefreshToken) => {
    if (!token) return false;
    if (useTokenCache()) {
      return await RedisAdapter.revokeToken(token);
    } else {
      return await MongoAdapter.revokeToken(token);
    }
  },

  saveAuthorizationCode: async (code: AuthorizationCode, client: ClientInterface, user: User) => {
    try {
      const authorizationCode = {
        ...code,
        client: client || {},
        user: user || {},
      };
      if (useTokenCache()) {
        return await RedisAdapter.saveAuthorizationCode(authorizationCode);
      } else {
        return await MongoAdapter.saveAuthorizationCode(authorizationCode);
      }
    } catch (err) {
      log.error("Error saving authorization code:");
      log.error(err);
      throw err;
    }
  },

  getAuthorizationCode: async (authorizationCode: any) => {
    try {
      if (useTokenCache()) {
        return await RedisAdapter.getAuthorizationCode(authorizationCode);
      } else {
        return await MongoAdapter.getAuthorizationCode(authorizationCode);
      }
    } catch (err) {
      log.error("Error retrieving auth code:");
      log.error(err);
      throw err;
    }
  },

  revokeAuthorizationCode: async (authorizationCode: any): Promise<boolean> => {
    try {
      const code = authorizationCode.authorizationCode;
      if (useTokenCache()) {
        return await RedisAdapter.revokeAuthorizationCode(code);
      } else {
        return await MongoAdapter.revokeAuthorizationCode(code);
      }
    } catch (err) {
      log.error("Error deleting authorization code:");
      log.error(err);
      throw err;
    }
  },

  validateScope: (user: UserInterface, client: ClientInterface, scope: string[]): Promise<string[] | Falsey> => {
    log.debug("Validating scope %s for client %s and user %s.", scope, client.id, user.username);
    return new Promise((resolve) => {
      const clientHasAccess = ScopeManager.canRequestScope(scope, client);
      if (!clientHasAccess) {
        log.debug(
          "Scope validation for client %s failed due to insufficient access. Requested scope: %s",
          client.id,
          scope,
        );
        return resolve(false);
      }
      if (client.id === user.username) {
        // For client credentials grant, there is no notion of user.
        return resolve(scope);
      }
      // User flow starts here.
      if (!user.scope) {
        user.scope = Configuration.get("user.account-creation.default-scope");
      }
      // Sometimes, the frontends do not know the scopes a user can request ahead of time.
      // Since there is usually a higher amount of trust for internal clients in the system,
      // it is okay to return all scopes that a user has access to.
      if (client.role === Role.SystemRoles.INTERNAL_CLIENT) {
        const userRoleScopes = Role.getRoleScopes(user.role);
        scope = [...user.scope, ...userRoleScopes];
        log.debug(
          "Granting all allowed scopes (%s) for user %s due to request from internal client",
          scope,
          user.username,
        );
        return resolve(scope);
      }
      const userHasAccess = ScopeManager.canRequestScope(scope, user);
      if (userHasAccess) {
        resolve(scope);
      } else {
        resolve(false);
      }
    });
  },

  verifyScope: (token: Token, requestedScopes: string[]): Promise<boolean> => {
    log.info("Verifying scope for token %s...", token.accessToken);
    return new Promise((resolve) => {
      const authorizedScopes = token.scope;
      if (!authorizedScopes) {
        return false;
      }
      return resolve(requestedScopes.every((s: string) => authorizedScopes.indexOf(s) >= 0));
    });
  },
};

export default OAuthModel;
