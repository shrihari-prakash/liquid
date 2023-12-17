import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

import bcrypt from "bcrypt";

import ClientModel from "../model/mongo/client";
import { Configuration } from "../singleton/configuration";
import UserModel from "../model/mongo/user";
import { bcryptConfig } from "../service/api/user/create.post";

async function createApplicationClient() {
  try {
    if (await ClientModel.findOne({})) {
      return;
    }
    const client = {
      id: "application_client",
      grants: ["client_credentials", "authorization_code", "refresh_token"],
      redirectUris: ["https://localhost:2000", "https://localhost:2001"], // 1. Liqud, 2. Nitrogen
      secret: "super-secure-client-secret",
      role: "internal_client",
      scope: ["*"],
      displayName: "Demo Client",
    };
    await new ClientModel(client).save();
    log.info("Demo client inserted successfully. %o", client);
  } catch (error) {
    log.error(error);
  }
}

async function createAdminUser() {
  try {
    if (await UserModel.findOne({})) {
      return;
    }
    const user = {
      username: "liquid_demo",
      firstName: "Liquid",
      lastName: "Demo",
      email: "liquid_demo@example.com",
      role: "super_admin",
      password: await bcrypt.hash("liquid_demo", bcryptConfig.salt),
      credits: 0,
      scope: ["*"],
      creationIp: "127.0.0.1",
      emailVerified: true,
    };
    await new UserModel(user).save();
    log.info("Demo user inserted successfully. %o", user);
  } catch (error) {
    log.error(error);
  }
}

export const initializeDemo = () => {
  if (!Configuration.get("system.demo-mode")) {
    return;
  }
  log.warn(
    "Starting Liquid in Demo Mode. If you didn't intend to start it this way, turn of the option `system.demo-mode`"
  );
  createApplicationClient();
  createAdminUser();
};
