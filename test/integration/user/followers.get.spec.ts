import chai from "chai";
import "chai-http";

import app from "../../../src/index";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("followers.get", () => {
  before(setupUsers);

  it("test get followers list", async () => {
    const followResponse = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(followResponse.status).to.eql(200);
    const followingResponse = await chai
      .request(app)
      .get("/user/followers")
      .set({ Authorization: `Bearer rick_asthley_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(1);
    chai.expect(followingResponse.body.data.records[0].email === (MemoryStore.users.user2 as any).email);
  });
});
