import chai from "chai";
import "chai-http";

import app from "../../../src";
import MemoryStore from "../store";

describe("client.get", () => {
  it("should get client details", async () => {
    const res = await chai
      .request(app)
      .get(`/client`)
      .query({
        id: MemoryStore.client.id,
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.client.client_secret).to.eql(undefined);
    chai.expect(res.body.data.client.id).to.eql("application_client");
    chai.expect(res.body.data.client.displayName).to.eql("Application Client");
    chai.expect(res.body.data.client.role).to.eql("internal_client");
  });

  it("should not get client details for invalid client id", async () => {
    const res = await chai
      .request(app)
      .get(`/client`)
      .query({
        id: "whatever",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.client).to.eql(null);
  });
});
