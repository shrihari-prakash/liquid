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

process.env.NODE_ENV = "test";
process.env.SYSTEM_LOG_LEVEL = "error";
process.env.CAN_USE_CACHE = "false";

chai.use(chaiHttp);

describe("Integration Test", () => {
  before(async () => {
    await mongod.start();
    process.env.MONGO_DB_CONNECTION_STRING = await mongod.getUri();
    MongoDB.connect();
    await ClientModel.deleteMany({});
    console.log("Init done.");
  });
  it("should", () => {});
});
