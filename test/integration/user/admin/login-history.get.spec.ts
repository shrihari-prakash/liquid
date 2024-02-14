import chai from "chai";
import "chai-http";

import app from "../../../../src/index";
import { Configuration } from "../../../../src/singleton/configuration";
import LoginHistoryModel from "../../../../src/model/mongo/login-history";

import { MockData, setupUsers } from "../../utils/records";
import MemoryStore from "../../store";
import { ObjectId } from "mongoose";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

describe("admin-api.login-history.get", () => {
  before(setupUsers);

  it("should get login history for user john_doe", async () => {
    await LoginHistoryModel.deleteMany({});
    Configuration.set("user.login.record-successful-attempts", true);
    Configuration.set("user.login.record-failed-attempts", true);
    await chai.request(app).post("/user/login").send({
      username: "john_doe",
      password: "wrongPa$$word",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    });
    await chai
      .request(app)
      .post("/user/login")
      .send({ ...MockData.users.user1, userAgent });
    const res = await chai
      .request(app)
      .get("/user/admin-api/login-history")
      .query({ target: (MemoryStore.users.user1._id as unknown as ObjectId).toString() })
      .set({ Authorization: `Bearer rick_asthley_access_token` });
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
