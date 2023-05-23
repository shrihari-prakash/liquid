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

process.env.NODE_ENV = "test";
process.env.CAN_USE_CACHE = "false";
process.env.USER_ACCOUNT_CREATION_ALLOW_ONLY_WHITELISTED_EMAIL_DOMAINS = "false";

Logger.logger.level = "error";

chai.use(chaiHttp);

describe("Integration Test", () => {
  before(async () => {
    await mongod.start();
    process.env.MONGO_DB_CONNECTION_STRING = await mongod.getUri();
    MongoDB.connect();
    await ClientModel.deleteMany({});
  });
  it("dummy test", () => {});
});
