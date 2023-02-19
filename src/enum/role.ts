import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "role" });

import { Configuration } from "../singleton/configuration";

const Role: any = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  INTERNAL_CLIENT: "INTERNAL_CLIENT",
  EXTERNAL_CLIENT: "EXTERNAL_CLIENT",
  USER: "USER",
};

Configuration.get("system.role.extended-roles").forEach((role: string) => (Role[role] = role));

log.debug("Roles initialized. Values: %o", Role);

const roleRanking = Configuration.get("system.role.ranking");
if (roleRanking.some((role: string) => !Object.keys(Role).includes(role.split("(")[0]))) {
  log.error("Bad configuration for role order.");
}

export default Role;
