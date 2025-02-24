import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { MongoMemoryServer } from "mongodb-memory-server";
const mongod = new MongoMemoryServer({
  instance: {
    port: 1111,
  },
});
import { MongoDB } from "../../src/singleton/mongo-db";
import ClientModel from "../../src/model/mongo/client";
import { Logger } from "../../src/singleton/logger";
import Options from "../../src/service/configuration/options.json";
import { Configuration } from "../../src/singleton/configuration";

console.log("Setting up tests...");
chai.use(chaiHttp);

process.env.NODE_ENV = "test";
process.env.CAN_USE_CACHE = "false";
Logger.logger.level = "error";

Options.forEach((option) => {
  if (option.name === "environment" || option.name === "privilege.can-use-cache") return;
  if (typeof option.default !== "undefined") Configuration.set(option.name, option.default);
  console.log(`${option.name} =`, Configuration.get(option.name));
});

Configuration.set("system.email-adapter", "print");
Configuration.set("2fa.email.enabled", true);
Configuration.set("system.app-port", 1111);

exports.mochaHooks = {
  async beforeAll() {
    await mongod.start();
    Configuration.set("mongo-db.connection-string", await mongod.getUri());
    MongoDB.connect();
    await ClientModel.deleteMany({});
    console.log("Setup complete.");
  },
};
