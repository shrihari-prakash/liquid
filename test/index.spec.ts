process.env.NODE_ENV = "test";
process.env.MONGO_DB_CONNECTION_STRING = "mongodb://127.0.0.1:27017/liquid-test";
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

describe("Integration Test", () => {
  describe("OAuth", function () {
    runTest("Token", "./integration/oauth/token.spec");
  });

  describe("User", function () {
    runTest("Create", "./integration/user/create.spec");
    runTest("Login", "./integration/user/login.spec");
    runTest("Me", "./integration/user/me.spec");
    runTest("Follow", "./integration/user/follow.spec");
    runTest("Unfollow", "./integration/user/unfollow.spec");
    runTest("Private", "./integration/user/private.spec");
    runTest("Block", "./integration/user/block.spec");
    runTest("Unblock", "./integration/user/unblock.spec");
  });
});
