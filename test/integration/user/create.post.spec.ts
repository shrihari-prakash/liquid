import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";
import VerificationCodeModel from "../../../src/model/mongo/verification-code";
import { Configuration } from "../../../src/singleton/configuration";

import { MockData } from "../utils/records";

describe("create.post", () => {
  before(async () => {
    await UserModel.deleteMany({});
    await VerificationCodeModel.deleteMany({});
  });

  after(async () => {
    await VerificationCodeModel.deleteMany({});
  });

  it("should create user john_doe", () => {
    return chai
      .request(app)
      .post("/user/create")
      .send(MockData.users.user1)
      .then((res) => {
        chai.expect(res.status).to.eql(201);
      });
  });

  describe("test username", () => {
    const u = { ...MockData.users.user1 };

    it("should not create user for long username", () => {
      u.username = "abcdefghijklmnopqrstuvwxyz123456789";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
          chai.expect(res.body.additionalInfo.errors[0].path).to.eql("username");
          chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.username);
        });
    });

    it("should not create user for short username", () => {
      u.username = "a";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
        });
    });

    it("should not create user for invalid username", () => {
      (u as any).username = { username: { $gt: "" } };
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
        });
    });
  });

  describe("test name", () => {
    let u: any = {};
    beforeEach(() => {
      u = { ...MockData.users.user1 };
    });

    it("should not create user for long firstName", () => {
      u.firstName = "abcdefghijklmnopqrstuvwxyz123456789";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
          chai.expect(res.body.additionalInfo.errors[0].path).to.eql("firstName");
          chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.firstName);
        });
    });

    it("should not create user for empty firstName", () => {
      u.firstName = "";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
        });
    });

    it("should not create user for long lastName", () => {
      u.lastName = "abcdefghijklmnopqrstuvwxyz123456789";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
          chai.expect(res.body.additionalInfo.errors[0].path).to.eql("lastName");
          chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.lastName);
        });
    });

    it("should not create user for empty lastName", () => {
      u.lastName = "";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
        });
    });
  });

  describe("test email", () => {
    let u: any = {};
    beforeEach(() => {
      u = { ...MockData.users.user1 };
    });

    it("should not create user for long email", () => {
      u.email = "abcdefghijklmnopqrstuvwxyz123456789abcdefghijklmnopqrstuvwxyz123456789@example.com";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
          chai.expect(res.body.additionalInfo.errors[0].path).to.eql("email");
          chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.email);
        });
    });

    it("should not create user for invalid email", () => {
      u.email = "a";
      return chai
        .request(app)
        .post("/user/create")
        .send(u)
        .then((res) => {
          chai.expect(res.status).to.eql(400);
        });
    });
  });

  let codeCache: any = null;

  it("should verify email for john_doe", async () => {
    const code = (await VerificationCodeModel.findOne({}).exec()) as any;
    codeCache = code;
    return chai
      .request(app)
      .get("/user/verify-email")
      .query({ target: code.belongsTo.toString(), code: code.code })
      .then((res) => {
        chai.expect(res.status).to.eql(200);
      });
  });

  it("should NOT verify email for john_doe with same code for the second time", async () => {
    return chai
      .request(app)
      .get("/user/verify-email")
      .query({ target: codeCache.belongsTo.toString(), code: codeCache.code })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });

  it("should not create duplicate account", () => {
    return chai
      .request(app)
      .post("/user/create")
      .send(MockData.users.user1)
      .then((res) => {
        chai.expect(res.status).to.eql(409);
      });
  });

  it("should create account rick_asthley", async () => {
    return chai
      .request(app)
      .post("/user/create")
      .send(MockData.users.user2)
      .then((res) => {
        chai.expect(res.status).to.eql(201);
      });
  });

  describe("test custom data", () => {
    beforeEach(async () => {
      await UserModel.deleteMany({});
      await VerificationCodeModel.deleteMany({});
    });

    const user = {
      _id: null,
      username: "jack_daniels",
      password: "helloworld",
      firstName: "Jack",
      lastName: "Daniels",
      email: "jackdaniels@example.com",
      scope: ["*"],
    };

    it("should create account with proper custom data", async () => {
      const customData = `{"key" : "value"}`;
      Configuration.set("user.account-creation.custom-data.default-value", customData);
      const res = await chai.request(app).post("/user/create").send(user);
      chai.expect(res.status).to.eql(201);
      const dbUser = (await UserModel.findOne({ username: user.username })) as unknown as UserInterface;
      chai.expect(dbUser.customData).to.eql(customData);
    });

    it("should create account with {} as custom data for invalid configuration", async () => {
      const customData = `{"key" : invalid`;
      Configuration.set("user.account-creation.custom-data.default-value", customData);
      const res = await chai.request(app).post("/user/create").send(user);
      chai.expect(res.status).to.eql(201);
      const dbUser = (await UserModel.findOne({ username: user.username })) as unknown as UserInterface;
      chai.expect(dbUser.customData).to.eql("{}");
    });
  });

  describe("test preserve unverified user id", () => {
    beforeEach(async () => {
      await UserModel.deleteMany({});
      await VerificationCodeModel.deleteMany({});
    });

    const user = {
      username: "test_preserve_id",
      password: "testpassword",
      firstName: "Test",
      lastName: "User",
      email: "testpreserveid@example.com",
    };

    it("should preserve existing user ID when replacing unverified user", async () => {
      Configuration.set("user.account-creation.preserve-unverified-user-id", true);
      Configuration.set("user.account-creation.require-email-verification", true);

      const firstRes = await chai.request(app).post("/user/create").send(user);
      chai.expect(firstRes.status).to.eql(201);
      const firstUserId = firstRes.body.data.user._id;

      const secondRes = await chai.request(app).post("/user/create").send(user);
      chai.expect(secondRes.status).to.eql(201);
      const secondUserId = secondRes.body.data.user._id;

      chai.expect(secondUserId).to.eql(firstUserId);

      const dbUsers = await UserModel.find({ username: user.username });
      chai.expect(dbUsers.length).to.eql(1);
      chai.expect(dbUsers[0]._id.toString()).to.eql(firstUserId);
    });

    it("should generate new user ID when preservation is disabled", async () => {
      Configuration.set("user.account-creation.preserve-unverified-user-id", false);
      Configuration.set("user.account-creation.require-email-verification", true);

      const firstRes = await chai.request(app).post("/user/create").send(user);
      chai.expect(firstRes.status).to.eql(201);
      const firstUserId = firstRes.body.data.user._id;

      const secondRes = await chai.request(app).post("/user/create").send(user);
      chai.expect(secondRes.status).to.eql(201);
      const secondUserId = secondRes.body.data.user._id;

      chai.expect(secondUserId).to.not.eql(firstUserId);

      const dbUsers = await UserModel.find({ username: user.username });
      chai.expect(dbUsers.length).to.eql(1);
      chai.expect(dbUsers[0]._id.toString()).to.eql(secondUserId);
    });
  });
});

