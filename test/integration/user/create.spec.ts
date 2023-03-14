import app from "../../../src/index";
import chai, { use } from "chai";
import UserModel from "../../../src/model/mongo/user";
import VerificationCodeModel from "../../../src/model/mongo/verification-code";
import MemoryStore from "../store";

before(async () => {
  await UserModel.deleteMany({});
  await VerificationCodeModel.deleteMany({});
});

after(async () => {
  const users = await UserModel.find({});

  const user1password = MemoryStore.users.user1.password;
  (MemoryStore.users.user1 as any) = users[0];
  MemoryStore.users.user1.password = user1password;

  const user2password = MemoryStore.users.user2.password;
  (MemoryStore.users.user2 as any) = users[1];
  MemoryStore.users.user2.password = user2password;

  await UserModel.updateOne({ email: MemoryStore.users.user2.email }, { $set: { emailVerified: true } });
  await VerificationCodeModel.deleteMany({});
});

it("should create user john_doe", () => {
  return chai
    .request(app)
    .post("/user/create")
    .send(MemoryStore.users.user1)
    .then((res) => {
      chai.expect(res.status).to.eql(201);
    });
});

describe("test username", () => {
  const u = { ...MemoryStore.users.user1 };

  it("should not create user for long username", () => {
    u.username = "abcdefghijklmnopqrstuvwxyz123456789";
    return chai
      .request(app)
      .post("/user/create")
      .send(u)
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("username");
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
    u = { ...MemoryStore.users.user1 };
  });

  it("should not create user for long firstName", () => {
    u.firstName = "abcdefghijklmnopqrstuvwxyz123456789";
    return chai
      .request(app)
      .post("/user/create")
      .send(u)
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("firstName");
        chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.firstName);
      });
  });

  it("should not create user for short firstName", () => {
    u.firstName = "a";
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
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("lastName");
        chai.expect(res.body.additionalInfo.errors[0].value).to.eql(u.lastName);
      });
  });

  it("should not create user for short lastName", () => {
    u.lastName = "a";
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
    u = { ...MemoryStore.users.user1 };
  });

  it("should not create user for long email", () => {
    u.email = "abcdefghijklmnopqrstuvwxyz123456789abcdefghijklmnopqrstuvwxyz123456789@example.com";
    return chai
      .request(app)
      .post("/user/create")
      .send(u)
      .then((res) => {
        chai.expect(res.status).to.eql(400);
        chai.expect(res.body.additionalInfo.errors[0].param).to.eql("email");
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

let codeCache = null;

it("should verify email for john_doe", async () => {
  const code = (await VerificationCodeModel.findOne({}).exec()) as any;
  codeCache = code;
  return chai
    .request(app)
    .get("/user/verify-email")
    .query({ code: code.code })
    .then((res) => {
      chai.expect(res.status).to.eql(200);
    });
});

it("should verify email for john_doe with same code for the second time", async () => {
  const code = (await VerificationCodeModel.findOne({}).exec()) as any;
  return chai
    .request(app)
    .get("/user/verify-email")
    .query({ code: codeCache })
    .then((res) => {
      chai.expect(res.status).to.eql(400);
    });
});

it("should not create duplicate account", () => {
  return chai
    .request(app)
    .post("/user/create")
    .send(MemoryStore.users.user1)
    .then((res) => {
      chai.expect(res.status).to.eql(409);
    });
});

it("should create account rick_asthley", async () => {
  return chai
    .request(app)
    .post("/user/create")
    .send(MemoryStore.users.user2)
    .then((res) => {
      chai.expect(res.status).to.eql(201);
    });
});
