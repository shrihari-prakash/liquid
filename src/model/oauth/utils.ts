import { Role } from "../../singleton/role.js";

export const isApplicationClient = (user: any) => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  const appplicationClient =
    user.role === Role.SystemRoles.INTERNAL_CLIENT || user.role === Role.SystemRoles.EXTERNAL_CLIENT;
  return appplicationClient;
};
