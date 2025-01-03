import { Configuration } from "../singleton/configuration.js";
import { Role } from "../singleton/role.js";

export const extractRank = (role: string) => {
  return Role.getRoleRank(role);
};

export const findRoleRank = (role: string) => {
  const roleRanking = Configuration.get("system.role.ranking");
  return roleRanking.find((r: string) => r.split("(")[0] === role);
};

export const isRoleRankHigher = (currentRole: string, comparisonRole: string) => {
  const currentRoleRank = extractRank(findRoleRank(currentRole));
  const comparisonRoleRank = extractRank(findRoleRank(comparisonRole));
  if (Configuration.get("admin-api.user.profile.can-edit-peer-data")) {
    return currentRoleRank <= comparisonRoleRank;
  }
  return currentRoleRank < comparisonRoleRank;
};
