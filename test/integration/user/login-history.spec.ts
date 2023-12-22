import chai from "chai";

import app from "../../../src";
import { MockData, setupUsers } from "../utils/records";
import { Configuration } from "../../../src/singleton/configuration";
import LoginHistoryModel from "../../../src/model/mongo/login-history";

const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

describe("Login History", () => {
  before(setupUsers);

  it("[GET] should get login history for user john_doe", async () => {
    await LoginHistoryModel.deleteMany({});
    Configuration.set("user.login.record-successful-attempts", true);
    Configuration.set("user.login.record-failed-attempts", true);
    await chai.request(app).post("/user/login").send({ username: "john_doe", password: "wrongPa$$word", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0" });
    await chai.request(app).post("/user/login").send({ ...MockData.users.user1, userAgent });
    const res = await chai
      .request(app)
      .get("/user/login-history")
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const records = res.body.data.records;
    chai.expect(records[0].success).to.eql(true);
    chai.expect(records[1].success).to.eql(false);
    chai.expect(records[1].reason).to.eql("password_rejected");
    Configuration.set("user.login.record-successful-attempts", false);
    Configuration.set("user.login.record-failed-attempts", false);
    await LoginHistoryModel.deleteMany({});
  });
});
