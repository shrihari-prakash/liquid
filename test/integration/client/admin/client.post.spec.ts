import chai from "chai";
import "chai-http";

import app from "../../../../src";
import ClientModel from "../../../../src/model/mongo/client";
import { setupUsers } from "../../utils/records";

describe("client.post", () => {
  before(setupUsers);
  beforeEach(async () => {
    await ClientModel.deleteMany({});
  });

  it("should create internal client", async () => {
    const client = {
      id: "liquid_client",
      grants: ["client_credentials", "authorization_code", "refresh_token", "password"],
      redirectUris: ["https://localhost:2000/health"],
      secret: "super-secure-secret",
      role: "internal_client",
      scope: ["client:all"],
      displayName: "Liquid Client",
    };
    const res = await chai
      .request(app)
      .post(`/client/admin-api/create`)
      .send(client)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const dbClient = (await ClientModel.findOne({ id: client.id })) as any;
    chai.expect(dbClient.scope).to.eql(client.scope);
    chai.expect(dbClient.id).to.eql(client.id);
    chai.expect(dbClient.grants).to.eql(client.grants);
    chai.expect(dbClient.redirectUris).to.eql(client.redirectUris);
    chai.expect(dbClient.role).to.eql(client.role);
    chai.expect(dbClient.displayName).to.eql(client.displayName);
  });

  it("should create external client", async () => {
    const client = {
      id: "liquid_client",
      grants: ["client_credentials", "authorization_code", "refresh_token", "password"],
      redirectUris: ["https://localhost:2000/health"],
      secret: "super-secure-secret",
      role: "external_client",
      scope: ["client:all"],
      displayName: "Liquid Client",
    };
    const res = await chai
      .request(app)
      .post(`/client/admin-api/create`)
      .send(client)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const dbClient = (await ClientModel.findOne({ id: client.id })) as any;
    chai.expect(dbClient.scope).to.eql(client.scope);
    chai.expect(dbClient.id).to.eql(client.id);
    chai.expect(dbClient.grants).to.eql(client.grants);
    chai.expect(dbClient.redirectUris).to.eql(client.redirectUris);
    chai.expect(dbClient.role).to.eql(client.role);
    chai.expect(dbClient.displayName).to.eql(client.displayName);
  });

  it("should reject invalid role", async () => {
    const client = {
      id: "liquid_client",
      grants: ["client_credentials", "authorization_code", "refresh_token", "password"],
      redirectUris: ["https://localhost:2000/health"],
      secret: "super-secure-secret",
      role: "super_admin",
      scope: ["user.client.all"],
      displayName: "Liquid Client",
    };
    const res = await chai
      .request(app)
      .post(`/client/admin-api/create`)
      .send(client)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(400);
    const dbClient = (await ClientModel.findOne({ id: client.id })) as any;
    chai.expect(dbClient).to.eql(null);
  });

  it("should reject invalid grant", async () => {
    const client = {
      id: "liquid_client",
      grants: ["invalid_grant"],
      redirectUris: ["https://localhost:2000/health"],
      secret: "super-secure-secret",
      role: "internal_client",
      scope: ["user.client.all"],
      displayName: "Liquid Client",
    };
    const res = await chai
      .request(app)
      .post(`/client/admin-api/create`)
      .send(client)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(400);
    const dbClient = (await ClientModel.findOne({ id: client.id })) as any;
    chai.expect(dbClient).to.eql(null);
  });

  it("should reject invalid scope", async () => {
    const client = {
      id: "liquid_client",
      grants: ["client_credentials"],
      redirectUris: ["https://localhost:2000/health"],
      secret: "super-secure-secret",
      role: "internal_client",
      scope: ["invalid.scope"],
      displayName: "Liquid Client",
    };
    const res = await chai
      .request(app)
      .post(`/client/admin-api/create`)
      .send(client)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(400);
    const dbClient = (await ClientModel.findOne({ id: client.id })) as any;
    chai.expect(dbClient).to.eql(null);
  });
});
