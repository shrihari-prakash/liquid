import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "bootstrap-service" });

import bcrypt from "bcrypt";

import { Configuration } from "../../singleton/configuration.js";
import { bcryptConfig } from "../api/user/create.post.js";
import UserModel from "../../model/mongo/user.js";
import ClientModel from "../../model/mongo/client.js";

export class Bootstrap {
  public verifyAdminConfig() {
    const username = Configuration.get("system.super-admin.username");
    const firstName = Configuration.get("system.super-admin.first-name");
    const lastName = Configuration.get("system.super-admin.last-name");
    const password = Configuration.get("system.super-admin.password");
    const email = Configuration.get("system.super-admin.email");
    if (!username || !firstName || !lastName || !password || !email) {
      throw new Error("Super admin configuration is incomplete. Check the values system.super-admin.* in config.");
    }
  }

  public hasUsers() {
    return UserModel.findOne({});
  }

  public async createSuperAdmin() {
    if (await this.hasUsers()) {
      log.info("Super admin already exists. Skipping creation.");
      return;
    }
    this.verifyAdminConfig();
    const password = Configuration.get("system.super-admin.password");
    const hashedPassword = await bcrypt.hash(password, bcryptConfig.salt);
    const user = {
      username: Configuration.get("system.super-admin.username"),
      firstName: Configuration.get("system.super-admin.first-name"),
      lastName: Configuration.get("system.super-admin.last-name"),
      email: Configuration.get("system.super-admin.email"),
      password: hashedPassword,
      role: "super_admin",
      credits: 0,
      scope: ["*"],
      creationIp: "127.0.0.1",
      emailVerified: true,
      verified: true,
    };
    await new UserModel(user).save();
    log.info("Super admin created successfully. username: %s", user.username);
  }

  public verifyClientConfig() {
    const id = Configuration.get("system.default-client.id");
    const redirectUris = Configuration.get("system.default-client.redirect-uris");
    const secret = Configuration.get("system.default-client.secret");
    const displayName = Configuration.get("system.default-client.display-name");
    if (!id || !redirectUris || !secret || !displayName) {
      throw new Error(
        "Default client configuration is incomplete. Check the values system.default-client.* in config.",
      );
    }
  }

  public async hasClients() {
    return ClientModel.findOne({});
  }

  public async createDefaultClient() {
    try {
      if (await this.hasClients()) {
        log.info("Default client already exists. Skipping creation.");
        return;
      }
      this.verifyClientConfig();
      const client = {
        id: Configuration.get("system.default-client.id"),
        redirectUris: Configuration.get("system.default-client.redirect-uris"),
        secret: Configuration.get("system.default-client.secret"),
        displayName: Configuration.get("system.default-client.display-name"),
        grants: ["client_credentials", "authorization_code", "refresh_token"],
        role: "internal_client",
        scope: ["*"],
      };
      await new ClientModel(client).save();
      log.info("Default client created successfully. id: %s", client.id);
    } catch (error) {
      log.error(error);
    }
  }

  public async configure() {
    log.info("Bootstrapping system...");
    await this.createSuperAdmin();
    await this.createDefaultClient();
    log.info("System bootstrapping complete.");
  }
}

