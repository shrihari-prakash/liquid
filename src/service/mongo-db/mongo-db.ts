import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "mongo-db" });

import mongoose from "mongoose";

import { Configuration } from "../../singleton/configuration";

export class MongoDB {
  constructor() {
    mongoose.set("strictQuery", false);
  }
  public async connect() {
    try {
      const connectionString = Configuration.get("mongo-db.connection-string");
      await mongoose.connect(connectionString as string);
      log.info("Connected to MongoDB (%s).", connectionString.replace(/\/\/([^:]+):(.*)@/, "//***:***@"));
    } catch (error) {
      log.error(error);
    }
  }
}
