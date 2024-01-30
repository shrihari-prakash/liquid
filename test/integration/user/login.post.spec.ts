import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import { Configuration } from "../../../src/singleton/configuration";
import LoginHistoryModel from "../../../src/model/mongo/login-history";

import { MockData } from "../utils/records";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";

describe("login.post", () => {
  before(async () => {
    await LoginHistoryModel.deleteMany({});
  });

  after(async () => {
    await LoginHistoryModel.deleteMany({});
  });

  it("should login user john_doe", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ ...MockData.users.user1, userAgent })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const record = await LoginHistoryModel.findOne({ success: true });
        chai.expect(record).to.be.null;
      });
  });

  it("should record login history user john_doe", () => {
    Configuration.set("user.login.record-successful-attempts", true);
    return chai
      .request(app)
      .post("/user/login")
      .send({ ...MockData.users.user1, userAgent })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const record = await LoginHistoryModel.findOne({ success: true });
        chai.expect(record).to.not.be.null;
        Configuration.set("user.login.record-successful-attempts", false);
      });
  });

  it("should not login with wrong credentials", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: "password", userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it("should record login history user john_doe for failed attempt", () => {
    Configuration.set("user.login.record-failed-attempts", true);
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: "password", userAgent })
      .then(async (res) => {
        chai.expect(res.status).to.eql(401);
        const record = await LoginHistoryModel.findOne({ success: false });
        chai.expect(record).to.not.be.null;
        chai.expect(record?.reason).to.eql("password_rejected");
        Configuration.set("user.login.record-failed-attempts", false);
      });
  });

  it("should not login with short username", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "a", password: "password", userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
      });
  });

  it("should not login with short password", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: "a", userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("password");
      });
  });

  it("should not login with long username", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "abcdefghijklmnopqrstuvwxyz123456789", password: "password", userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
      });
  });

  it("should not login with long password", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({
        username: "john_doe",
        password:
          "abcdefghijklmnopqrstuvwxyz123456789abcdefghijklmnopqrstuvwxyz123456789abcdefghijklmnopqrstuvwxyz123456789abcdefghijklmnopqrstuvwxyz123456789",
      })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("password");
      });
  });

  it("should not login with invalid username", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: { username: { $gt: "" } }, password: "password", userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
      });
  });

  it("should not login with invalid password", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: { password: { $gt: "" } }, userAgent })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("password");
      });
  });
});
