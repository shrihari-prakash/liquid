import app from "../../src/index";
import chai from "chai";
import STORE from "../store";
import ClientModel from "../../src/model/mongo/client";

it("test client credentials", async () => {
  await ClientModel.deleteMany({});
  chai
    .request(app)
    .post("/oauth/token")
    .set("content-type", "application/x-www-form-urlencoded")
    .send({
      grant_type: "client_credentials",
      client_id: "application_client",
      client_secret: "secret",
    })
    .then((res) => {
      chai.expect(res.body.access_token).to.be.a("string");
      chai.expect(res.body.token_type).to.equal("Bearer");
      chai.expect(res.status).to.eql(200);
      STORE.clientToken = res.body.access_token;
    });
});
