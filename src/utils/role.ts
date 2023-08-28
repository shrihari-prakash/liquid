import { Configuration } from "../singleton/configuration";

export const exractRank = (roleRank: string) => {
  return (roleRank.match(/\(([^)]+)\)/) as string[])[1];
};

const findRoleRank = (role: string) => {
  const roleRanking = Configuration.get("system.role.ranking");
  return roleRanking.find((r: string) => r.split("(")[0] === role);
};

export const isRoleRankHigher = (currentRole: string, comparisonRole: string) => {
  const currentRoleRank = exractRank(findRoleRank(currentRole));
  const comparisonRoleRank = exractRank(findRoleRank(comparisonRole));
  return parseInt(currentRoleRank) < parseInt(comparisonRoleRank);
};
