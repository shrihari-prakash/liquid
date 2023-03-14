import app from "../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import { Redis } from "../../src/singleton/redis";

after(async () => {
  await Redis.client.set(
    "john_doe_access_token",
    JSON.stringify({
      accessToken: "john_doe_access_token",
      authorizationCode: "john_doe_auth_code",
      accessTokenExpiresAt: "9999-01-01T00:00:00.000Z",
      refreshToken: "john_doe_refresh_token",
      refreshTokenExpiresAt: "9999-01-01T00:00:00.000Z",
      client: { ...MemoryStore.client },
      user: MemoryStore.users.user1,
    })
  );
  await Redis.client.set(
    "rick_asthley_access_token",
    JSON.stringify({
      accessToken: "rick_asthley_access_token",
      authorizationCode: "rick_asthley_auth_code",
      accessTokenExpiresAt: "9999-01-01T00:00:00.000Z",
      refreshToken: "rick_asthley_refresh_token",
      refreshTokenExpiresAt: "9999-01-01T00:00:00.000Z",
      client: { ...MemoryStore.client },
      user: MemoryStore.users.user2,
    })
  );
});

it("should login user john_doe", () => {
  return chai
    .request(app)
    .post("/user/login")
    .send(MemoryStore.users.user1)
    .then((res) => {
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
