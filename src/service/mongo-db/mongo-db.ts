import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "mongo-db" });

import mongoose from "mongoose";

import { Configuration } from "../../singleton/configuration";

export class MongoDB {
  public async connect() {
    try {
      await mongoose.connect(
        Configuration.get("mongoDBConnectionString") as string
      );
      log.info("Connected to MongoDB.");
    } catch (error) {
      log.error(error);
    }
  }
}
