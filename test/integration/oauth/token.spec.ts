import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import { setupUsers } from "../utils/records";
import MemoryStore from "../store";
import AuthorizationCodeModel from "../../../src/model/mongo/authorization-code";
import TokenModel from "../../../src/model/mongo/token";

describe("oauth.token", () => {
  before(setupUsers);

  const authCode = {
    authorizationCode: "john_doe_auth_code",
    expiresAt: new Date("9999-01-01T00:00:00.000Z"),
    client: MemoryStore.client,
    user: MemoryStore.users.user1,
    scope: ["*"],
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  it("should test access token flow", async () => {
    await AuthorizationCodeModel.create(authCode);
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: authCode.authorizationCode,
      client_id: MemoryStore.client.client_id,
    });
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");
    chai.expect(res.body).to.have.property("refresh_token");
    chai.expect(res.body).to.have.property("token_type");
    chai.expect(res.body).to.have.property("expires_in");
  });

  it("should test access token flow with invalid code", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: "invalid_code",
      client_id: MemoryStore.client.client_id,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_grant");
  });

  it("should test access token flow with invalid client id", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: authCode.authorizationCode,
      client_id: "invalid_client_id",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });

  const accessToken = {
    accessToken: "john_doe_access_token",
    refreshToken: "john_doe_refresh_token",
    accessTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
    refreshTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
    scope: ["*"],
    client: MemoryStore.client,
    user: MemoryStore.users.user1,
  };

  it("should test refresh token flow", async () => {
    await TokenModel.create(accessToken);
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: accessToken.refreshToken,
      client_id: MemoryStore.client.client_id,
    });
    console.log("res.body", res.body);
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");
    chai.expect(res.body).to.have.property("refresh_token");
    chai.expect(res.body).to.have.property("token_type");
    chai.expect(res.body).to.have.property("expires_in");
  });

  it("should test refresh token flow with invalid refresh token", async () => {
    await TokenModel.create(accessToken);
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: "invalid_refresh_token",
      client_id: MemoryStore.client.client_id,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_grant");
  });

  it("should test refresh token flow with invalid client id", async () => {
    await TokenModel.create(accessToken);
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: accessToken.refreshToken,
      client_id: "invalid_client_id",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });
});

