import moment from "moment";
import { RedisPrefixes } from "../enum/redis.js";
import { Configuration } from "../singleton/configuration.js";
import { Redis } from "../singleton/redis.js";
import { Role } from "../singleton/role.js";

export const isRoleRankHigher = (currentRole: string, comparisonRole: string) => {
  const currentRoleRank = Role.getRoleRank(currentRole);
  const comparisonRoleRank = Role.getRoleRank(comparisonRole);
  if (Configuration.get("admin-api.user.profile.can-edit-peer-data")) {
    return currentRoleRank <= comparisonRoleRank;
  }
  return currentRoleRank < comparisonRoleRank;
};

export const isRoleInvalidated = async (role: string, currentEntityRegisteredAt: string | Date) => {
  const invalidateTime = await Redis.get(`${RedisPrefixes.ROLE_INVALIDATION}${role}`);
  if (!invalidateTime) {
    return false;
  }
  const isInvalid = moment(invalidateTime).isAfter(moment(currentEntityRegisteredAt));
  return isInvalid;
};

