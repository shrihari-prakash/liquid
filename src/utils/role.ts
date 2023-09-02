import { Configuration } from "../singleton/configuration";

export const extractRank = (roleRank: string) => {
  return (roleRank.match(/\(([^)]+)\)/) as string[])[1];
};

export const findRoleRank = (role: string) => {
  const roleRanking = Configuration.get("system.role.ranking");
  return roleRanking.find((r: string) => r.split("(")[0] === role);
};

export const isRoleRankHigher = (currentRole: string, comparisonRole: string) => {
  const currentRoleRank = extractRank(findRoleRank(currentRole));
  const comparisonRoleRank = extractRank(findRoleRank(comparisonRole));
  if (Configuration.get("admin-api.user.profile.can-edit-peer-data")) {
    return parseInt(currentRoleRank) <= parseInt(comparisonRoleRank);
  }
  return parseInt(currentRoleRank) < parseInt(comparisonRoleRank);
};
