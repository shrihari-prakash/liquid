import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "role" });

import { Configuration } from "../singleton/configuration";

const Role: any = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  INTERNAL_CLIENT: "internal_client",
  EXTERNAL_CLIENT: "external_client",
  USER: "user",
};

Configuration.get("system.role.extended-roles").forEach((role: string) => (Role[role.toUpperCase()] = role));

log.debug("Roles initialized. Values: %s", Object.values(Role).join(", "));

const roleRanking = Configuration.get("system.role.ranking");
if (Object.values(Role).some((role: any) => !roleRanking.find((rank: string) => rank.startsWith(role)))) {
  log.error("Bad configuration for role ranking.");
}

export default Role;
