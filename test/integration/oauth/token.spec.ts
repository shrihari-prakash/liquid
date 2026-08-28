import * as chai from "chai";
import { request } from "chai-http";

import app from "../../../src/index";
import { setupUsers } from "../utils/records";
import MemoryStore from "../store";
import AuthorizationCodeModel from "../../../src/model/mongo/authorization-code";
import TokenModel from "../../../src/model/mongo/token";
import UserModel from "../../../src/model/mongo/user";
import ClientModel from "../../../src/model/mongo/client";
import { flushUserInfoFromRedis } from "../../../src/model/oauth/cache";

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
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: authCode.authorizationCode,
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");
    chai.expect(res.body).to.have.property("refresh_token");
    chai.expect(res.body).to.have.property("token_type");
    chai.expect(res.body).to.have.property("expires_in");
  });

  it("should fail access token flow when client_secret is missing for confidential client", async () => {
    await AuthorizationCodeModel.create(authCode);
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: authCode.authorizationCode,
      client_id: MemoryStore.client.client_id,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });

  it("should test access token flow with invalid code", async () => {
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: "invalid_code",
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_grant");
  });

  it("should test access token flow with invalid client id", async () => {
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "authorization_code",
      code: authCode.authorizationCode,
      client_id: "invalid_client_id",
      client_secret: MemoryStore.client.client_secret,
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
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: accessToken.refreshToken,
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");
    chai.expect(res.body).to.have.property("refresh_token");
    chai.expect(res.body).to.have.property("token_type");
    chai.expect(res.body).to.have.property("expires_in");
  });

  it("should test refresh token flow with invalid refresh token", async () => {
    await TokenModel.create(accessToken);
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: "invalid_refresh_token",
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_grant");
  });

  it("should test refresh token flow with invalid client id", async () => {
    await TokenModel.create(accessToken);
    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: accessToken.refreshToken,
      client_id: "invalid_client_id",
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });

  it("should dynamically recalculate scopes on refresh token flow when user scopes are added", async () => {
    const customUser = MemoryStore.users.user2 as any;
    await UserModel.updateOne({ _id: customUser._id }, { $set: { scope: ["delegated:all", "admin:all"] } });
    await flushUserInfoFromRedis(customUser._id as string);

    const scopedToken = {
      accessToken: "scope_test_access_token",
      refreshToken: "scope_test_refresh_token",
      accessTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
      refreshTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
      scope: ["delegated:all"],
      client: MemoryStore.client,
      user: customUser,
    };
    await TokenModel.create(scopedToken);

    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: scopedToken.refreshToken,
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
    });
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");

    const newDbToken: any = await TokenModel.findOne({ accessToken: res.body.access_token }).lean();
    chai.expect(newDbToken).to.not.be.null;
    chai.expect(newDbToken?.scope).to.include("admin:all");
    chai.expect(newDbToken?.scope).to.include("delegated:all");
  });

  it("should dynamically prune revoked scopes on refresh token flow for external client", async () => {
    const externalClient = {
      id: "external_test_client",
      secret: "external_secret",
      client_id: "external_test_client",
      client_secret: "external_secret",
      displayName: "External Client",
      grants: ["refresh_token"],
      grant_type: "refresh_token",
      role: "external_client",
      scope: ["delegated:profile:read"],
    };
    await ClientModel.create(externalClient);

    const customUser = MemoryStore.users.user3 as any;
    await UserModel.updateOne({ _id: customUser._id }, { $set: { scope: ["delegated:profile:read"] } });
    await flushUserInfoFromRedis(customUser._id as string);

    const scopedToken = {
      accessToken: "external_access_token",
      refreshToken: "external_refresh_token",
      accessTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
      refreshTokenExpiresAt: new Date("9999-01-01T00:00:00.000Z"),
      scope: ["delegated:profile:read", "admin:all"],
      client: externalClient,
      user: customUser,
    };
    await TokenModel.create(scopedToken);

    const res = await request.execute(app).post("/oauth/token").set(headers).send({
      grant_type: "refresh_token",
      refresh_token: scopedToken.refreshToken,
      client_id: externalClient.client_id,
      client_secret: externalClient.client_secret,
    });
    chai.expect(res.status).to.equal(200);

    const newDbToken: any = await TokenModel.findOne({ accessToken: res.body.access_token }).lean();
    chai.expect(newDbToken).to.not.be.null;
    chai.expect(newDbToken?.scope).to.include("delegated:profile:read");
    chai.expect(newDbToken?.scope).to.not.include("admin:all");
  });
});

