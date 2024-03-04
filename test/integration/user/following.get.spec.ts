import chai from "chai";
import "chai-http";

import app from "../../../src/index";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("following.get", () => {
  beforeEach(setupUsers);

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
    chai.expect(followingResponse.body.data.records[0].target.username).to.eq((MemoryStore.users.user2 as any).username);
    chai.expect(followingResponse.body.data.records[0].target.email).to.eq((MemoryStore.users.user2 as any).email);
  });

  it("test rick_asthley getting john_doe's following list", async () => {
    // john follows allisson
    const follow1Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user3 as any)._id });
    chai.expect(follow1Response.status).to.eql(200);
    // john follows rick
    const follow2Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(follow2Response.status).to.eql(200);
    // rick gets john's followers
    const followingResponse = await chai
      .request(app)
      .get("/user/" + MemoryStore.users.user1._id + "/following")
      .set({ Authorization: `Bearer rick_asthley_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(2);
    chai.expect(followingResponse.body.data.records[0].target.username).to.eq((MemoryStore.users.user2 as any).username);
    chai.expect(followingResponse.body.data.records[1].target.username).to.eq((MemoryStore.users.user3 as any).username);
  });

  it("test allisson_brooklyn blocking rick_asthley in john_doe's following list", async () => {
    // allisson blocks rick
    await chai
      .request(app)
      .post("/user/block")
      .set({ Authorization: `Bearer allisson_brooklyn_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    // john follows allisson
    const follow1Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user3 as any)._id });
    chai.expect(follow1Response.status).to.eql(200);
    // john follows rick
    const follow2Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(follow2Response.status).to.eql(200);
    // rick gets john's followers
    const followingResponse = await chai
      .request(app)
      .get("/user/" + MemoryStore.users.user1._id + "/following")
      .set({ Authorization: `Bearer rick_asthley_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(1);
    chai.expect(followingResponse.body.data.records[0].target.username).to.eq((MemoryStore.users.user2 as any).username);
  });
});
