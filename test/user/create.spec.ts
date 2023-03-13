import app from "../../src/index";
import chai from "chai";
import STORE from "../store";
import UserModel from "../../src/model/mongo/user";
import verificationCodeModel from "../../src/model/mongo/verification-code";

before(async () => {
  await UserModel.deleteMany({});
  await verificationCodeModel.deleteMany({});
});

export const user1 = {
  username: "john_doe",
  password: "helloworld",
  firstName: "John",
  lastName: "Doe",
  email: "johndoe@example.com",
};

export const user2 = {
  username: "rick_asthley",
  password: "helloworld",
  firstName: "Rick",
  lastName: "Asthley",
  email: "rickasthley@example.com",
};

it("should create user john_doe", () => {
  return chai
    .request(app)
    .post("/user/create")
    .send(user1)
    .then((res) => {
      chai.expect(res.status).to.eql(201);
    });
});

it("should verify email for john_doe", async () => {
  const code = (await verificationCodeModel.findOne({}).exec()) as any;
  return chai
    .request(app)
    .get("/user/verify-email")
    .query({ code: code.code })
    .then((res) => {
      chai.expect(res.status).to.eql(200);
    });
});

it("should not create duplicate account", () => {
  return chai
    .request(app)
    .post("/user/create")
    .send(user1)
    .then((res) => {
      chai.expect(res.status).to.eql(409);
    });
});

it("should create account rick_asthley", async () => {
  chai
    .request(app)
    .post("/user/create")
    .send(user2)
    .then(async (res) => {
      chai.expect(res.status).to.eql(201);
      await UserModel.updateOne({ email: user2.email }, { $set: { emailVerified: true } });
      await verificationCodeModel.deleteMany({});
    });
});
