import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import TokenModel from "../../../src/model/mongo/token";
import { MockData } from "../utils/records";

describe("Login", () => {
  it("should login user john_doe", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send(MockData.users.user1)
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
      });
  });

  it("should not login with wrong credentials", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: "password" })
      .then((res) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it("should not login with short username", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "a", password: "password" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
      });
  });

  it("should not login with short password", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: "a" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("password");
      });
  });

  it("should not login with long username", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "abcdefghijklmnopqrstuvwxyz123456789", password: "password" })
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
      .send({ username: { username: { $gt: "" } }, password: "password" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
      });
  });

  it("should not login with invalid password", () => {
    return chai
      .request(app)
      .post("/user/login")
      .send({ username: "john_doe", password: { password: { $gt: "" } } })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("password");
      });
  });
});
