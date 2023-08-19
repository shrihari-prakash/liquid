import chai from "chai";

import app from "../../../src";
import MemoryStore from "../store";

describe("Client", () => {
  it("[GET] should get client details", () => {
    return chai
      .request(app)
      .get(`/user/client`)
      .query({
        id: MemoryStore.client.id,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        chai.expect(res.status).to.eql(200);
        chai.expect(res.body.data.client.client_secret).to.eql(undefined);
        chai.expect(res.body.data.client.id).to.eql("application_client");
        chai.expect(res.body.data.client.displayName).to.eql("Application Client");
        chai.expect(res.body.data.client.role).to.eql("internal_client");
      });
  });
  it("[GET] should NOT get client details for invalid client id", () => {
    return chai
      .request(app)
      .get(`/user/client`)
      .query({
        id: "whatever",
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        chai.expect(res.status).to.eql(200);
        chai.expect(res.body.data.client).to.eql(null);
      });
  });
});
