import app from "../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import ClientModel from "../../src/model/mongo/client";

it("test client credentials", async () => {
  await ClientModel.deleteMany({});
  chai
    .request(app)
    .post("/oauth/token")
    .set("content-type", "application/x-www-form-urlencoded")
    .send(MemoryStore.client)
    .then((res) => {
      chai.expect(res.body.access_token).to.be.a("string");
      chai.expect(res.body.token_type).to.equal("Bearer");
      chai.expect(res.status).to.eql(200);
      MemoryStore.clientToken = res.body.access_token;
    });
});
