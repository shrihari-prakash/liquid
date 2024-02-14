import chai from "chai";
import "chai-http";

import app from "../../../src/index";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("following.get", () => {
  before(setupUsers);

  it("test get following list", async () => {
    const followResponse = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(followResponse.status).to.eql(200);
    const followingResponse = await chai
      .request(app)
      .get("/user/following")
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(1);
    chai.expect(followingResponse.body.data.records[0].email === (MemoryStore.users.user2 as any).email);
  });
});
