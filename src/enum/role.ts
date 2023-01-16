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

Configuration.get("system.role.extended-roles").forEach(
  (role: string) => (Role[role] = role)
);

log.debug("Roles initialized. Values: %o", Role);

const roleOrder = Configuration.get("system.role.order");
if (Object.keys(Role).some((role) => !roleOrder.includes(role))) {
  log.error("Bad configuration for role order.");
}

export default Role;
