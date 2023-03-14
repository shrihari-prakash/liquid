process.env.NODE_ENV = "test";
process.env.MONGO_DB_CONNECTION_STRING = "mongodb://localhost:27017/liquid-test";
process.env.REDIS_DB = "1";
process.env.SYSTEM_LOG_LEVEL = "error";

import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import app from "../src/index";

const runTest = (name, path) => {
  describe(name, function () {
    require(path);
  });
};

chai.use(chaiHttp);

describe("Health Check", () => {
  it("should test health", () => {
    return chai
      .request(app)
      .get("/health")
      .then((res) => chai.expect(res.status).to.eql(200));
  });
});

describe("User", function () {
  runTest("Create", "./user/create.post.spec");
  runTest("Login", "./user/login.post.spec");
  runTest("Me", "./user/me.get.spec");
});

describe("OAuth", function () {
  runTest("Token", "./oauth/token.spec");
});
