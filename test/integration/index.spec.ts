import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
const { MongoMemoryServer } = require("mongodb-memory-server");
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

process.env.NODE_ENV = "test";
process.env.CAN_USE_CACHE = "false";

Options.forEach((option) => {
  // Couldn't make Redis work with the tests unfortunately :(
  if (option.name === "environment" || option.name === "privilege.can-use-cache") return;
  if (typeof option.default !== "undefined") Configuration.set(option.name, option.default);
  console.log(`${option.name} =`, Configuration.get(option.name));
});
Logger.logger.level = "error";
chai.use(chaiHttp);

before(async () => {
  await mongod.start();
  Configuration.set("mongo-db.connection-string", await mongod.getUri());
  MongoDB.connect();
  await ClientModel.deleteMany({});
});
