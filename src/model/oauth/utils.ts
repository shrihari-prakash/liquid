import { Role } from "../../singleton/role.js";

export const isApplicationClient = (user: any) => {
  const appplicationClient =
    user.role === Role.SystemRoles.INTERNAL_CLIENT || user.role === Role.SystemRoles.EXTERNAL_CLIENT;
  return appplicationClient;
};
