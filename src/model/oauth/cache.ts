import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-utils" });

import { RedisPrefixes } from "../../enum/redis.js";
import { Configuration } from "../../singleton/configuration.js";
import { Redis } from "../../singleton/redis.js";
import UserModel from "../mongo/user.js";

const useTokenCache = Configuration.get("privilege.can-use-cache");

const getPrefixedUserId = (userId: string) => `${RedisPrefixes.USER}${userId}`;

export const flushUserInfoFromRedis = async (userIds: string | string[]) => {
  if (typeof userIds === "string") {
    userIds = [userIds];
  }
  for (let i = 0; i < userIds.length; i++) {
    const key = getPrefixedUserId(userIds[i]);
    await Redis.del(key);
    log.debug("User info for %s flushed from cache.", key);
  }
};

export const getUserInfo = async (userId: string) => {
  let userInfo;
  if (useTokenCache) {
    userInfo = await Redis.get(getPrefixedUserId(userId));
  }
  if (!userInfo) {
    userInfo = await UserModel.findById(userId).lean();
    if (useTokenCache) {
      await Redis.setEx(
        getPrefixedUserId(userId),
        JSON.stringify(userInfo),
        Configuration.get("oauth.refresh-token-lifetime") as number,
      );
    }
  } else {
    userInfo = JSON.parse(userInfo);
  }
  return userInfo;
};
