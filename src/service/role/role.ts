import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "role-service" });

import { ClientSession } from "mongoose";
import RoleModel, { RoleInterface } from "../../model/mongo/role.js";

import DefaultRoles from "./default-roles.json" assert { type: "json" };
import { Configuration } from "../../singleton/configuration.js";

export class Role {
  roles: Map<string, RoleInterface> = new Map();
  SystemRoles = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    USER: "user",
    INTERNAL_CLIENT: "internal_client",
    EXTERNAL_CLIENT: "external_client",
  };

  constructor() {
    log.debug("Role service initialized.");
    this.scheduleScan();
  }

  public getRolesMap(roles: RoleInterface[]): Map<string, RoleInterface> {
    const rolesMap = new Map<string, RoleInterface>();
    roles.forEach((role) => {
      rolesMap.set(role.id, role);
    });
    return rolesMap;
  }

  public async refreshRoles() {
    const dbRoles = (await RoleModel.find().lean()) as RoleInterface[];
    this.roles = this.getRolesMap(dbRoles);
    log.debug("Roles refreshed. %d roles found.", dbRoles.length);
  }

  public scheduleScan() {
    this.refreshRoles();
    setInterval(
      () => {
        log.debug("Scanning for new roles...");
        this.refreshRoles();
      },
      Configuration.get("system.roles.scan-interval") * 1000,
    );
  }

  public async createDefaultRoles() {
    const roles = await RoleModel.find();
    const missingRoles = DefaultRoles.filter((role) => !roles.find((r) => r.id === role.id));
    if (missingRoles.length === 0) {
      log.info("Default roles already in the database. Skipping creation.");
    } else {
      log.info("Creating default roles.");
      await RoleModel.insertMany(missingRoles);
    }
    await this.refreshRoles();
  }

  public async createRole(role: RoleInterface) {
    const newRole = await new RoleModel({ ...role, type: "user" }).save();
    log.info("Role created. Name: %s", role.id);
    await this.refreshRoles();
    return newRole;
  }

  public async updateRole(role: RoleInterface) {
    const query = {
      $set: {
        displayName: role.displayName,
        ranking: role.ranking,
        description: role.description,
      },
    };
    await RoleModel.updateOne({ id: role.id }, query);
    log.info("Role updated. Name: %s", role.id);
    await this.refreshRoles();
    return this.getRole(role.id);
  }

  public isSystemRole(id: string) {
    const systemRole = DefaultRoles.find((role) => role.id === id);
    if (systemRole) {
      return true;
    }
    return false;
  }

  public getRoles() {
    return this.roles;
  }

  public getRole(id: string) {
    return this.roles.get(id);
  }

  public getRoleScopes(id: string) {
    return this.getRole(id)?.scope || [];
  }

  public getRoleRank(id: string) {
    return this.getRole(id)?.ranking || 0;
  }

  public async deleteRole(id: string, sessionOptions?: { session: ClientSession }) {
    await RoleModel.deleteOne({ id }, sessionOptions);
    log.info("Role deleted. ID: %s", id);
    await this.refreshRoles();
  }

  public async isValidRole(id: string) {
    if (id in this.roles) {
      return true;
    }
    return false;
  }
}

