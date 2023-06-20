import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongod = new MongoMemoryServer({
  instance: {
    port: 1111,
  },
});
import { MongoDB } from "../src/singleton/mongo-db";
import ClientModel from "../src/model/mongo/client";
import { Logger } from "../src/singleton/logger";
import Options from "../src/service/configuration/options.json";

Options.forEach((option) => {
  if (option.default) process.env[option.envName] = option.default + "";
});
process.env.NODE_ENV = "test";
process.env.CAN_USE_CACHE = "false";

Logger.logger.level = "error";

chai.use(chaiHttp);

describe("Integration Test", () => {
  it("setup tests", async () => {
    await mongod.start();
    process.env.MONGO_DB_CONNECTION_STRING = await mongod.getUri();
    MongoDB.connect();
    await ClientModel.deleteMany({});
  });
});
