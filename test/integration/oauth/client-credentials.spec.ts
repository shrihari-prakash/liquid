import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import { setupUsers } from "../utils/records";
import MemoryStore from "../store";

describe("oauth.client-credentials", () => {
  before(setupUsers);

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  it("should test client credentials flow", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "client_credentials",
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
      scope: "*",
    });
    chai.expect(res.status).to.equal(200);
    chai.expect(res.body).to.have.property("access_token");
    chai.expect(res.body).to.have.property("token_type");
    chai.expect(res.body).to.have.property("expires_in");
  });

  it("should test client credentials flow with invalid client id", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "client_credentials",
      client_id: "invalid_client_id",
      client_secret: MemoryStore.client.client_secret,
      scope: "*",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });

  it("should test client credentials flow with invalid client secret", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "client_credentials",
      client_id: MemoryStore.client.client_id,
      client_secret: "invalid_secret",
      scope: "*",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_client");
  });

  it("should test client credentials flow with invalid scope", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "client_credentials",
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
      scope: "invalid_scope",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "invalid_scope");
  });

  it("should test client credentials flow with invalid grant type", async () => {
    const res = await chai.request(app).post("/oauth/token").set(headers).send({
      grant_type: "invalid_grant_type",
      client_id: MemoryStore.client.client_id,
      client_secret: MemoryStore.client.client_secret,
      scope: "*",
    });
    chai.expect(res.status).to.equal(401);
    chai.expect(res.body).to.have.property("error", "unsupported_grant_type");
  });
});

