import chai from "chai";
import "chai-http";

import app from "../../../src/index";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("followers.get", () => {
  beforeEach(setupUsers);

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
    chai
      .expect(followingResponse.body.data.records[0].source.username)
      .to.eq((MemoryStore.users.user1 as any).username);
    chai.expect(followingResponse.body.data.records[0].source.email).to.eq(undefined);
  });

  it("test rick_asthley getting john_doe's followers list", async () => {
    // allisson follows john
    const follow1Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer allisson_brooklyn_access_token` })
      .send({ target: (MemoryStore.users.user1 as any)._id });
    chai.expect(follow1Response.status).to.eql(200);
    // rick follows john
    const follow2Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer rick_asthley_access_token` })
      .send({ target: (MemoryStore.users.user1 as any)._id });
    chai.expect(follow2Response.status).to.eql(200);
    // rick gets john's followers
    const followingResponse = await chai
      .request(app)
      .get("/user/" + MemoryStore.users.user1._id + "/followers")
      .set({ Authorization: `Bearer rick_asthley_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(2);
    chai
      .expect(followingResponse.body.data.records[0].source.username)
      .to.eq((MemoryStore.users.user2 as any).username);
    chai
      .expect(followingResponse.body.data.records[1].source.username)
      .to.eq((MemoryStore.users.user3 as any).username);
  });

  it("test allisson_brooklyn blocking rick_asthley in john_doe's followers list", async () => {
    // allisson blocks rick
    await chai
      .request(app)
      .post("/user/block")
      .set({ Authorization: `Bearer allisson_brooklyn_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    // allisson follows john
    const follow1Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer allisson_brooklyn_access_token` })
      .send({ target: (MemoryStore.users.user1 as any)._id });
    chai.expect(follow1Response.status).to.eql(200);
    // rick follows john
    const follow2Response = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer rick_asthley_access_token` })
      .send({ target: (MemoryStore.users.user1 as any)._id });
    chai.expect(follow2Response.status).to.eql(200);
    // rick gets john's followers
    const followingResponse = await chai
      .request(app)
      .get("/user/" + MemoryStore.users.user1._id + "/followers")
      .set({ Authorization: `Bearer rick_asthley_access_token` });
    chai.expect(followingResponse.body.data.records.length).to.be.eq(1);
    chai
      .expect(followingResponse.body.data.records[0].source.username)
      .to.eq((MemoryStore.users.user2 as any).username);
  });
});
