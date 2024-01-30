import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import BlockModel from "../../../src/model/mongo/block";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("block.post", () => {
  before(setupUsers);

  describe("should test john_doe blocking rick_asthley", () => {
    it("run follow actions", async () => {
      await chai
        .request(app)
        .post("/user/follow")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send({ target: (MemoryStore.users.user1 as any)._id });
      await chai
        .request(app)
        .post("/user/follow")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ target: (MemoryStore.users.user2 as any)._id });
      const users = (await UserModel.find({})) as unknown as UserInterface[];
      chai.expect(users[0].followingCount).to.be.eq(1);
      chai.expect(users[0].followerCount).to.be.eq(1);
      chai.expect(users[1].followingCount).to.be.eq(1);
      chai.expect(users[1].followerCount).to.be.eq(1);
    });

    it("should block rick_asthley", async () => {
      const res = await chai
        .request(app)
        .post("/user/block")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ target: (MemoryStore.users.user2 as any)._id });
      chai.expect(res.status).to.eql(200);
      const blockObject = await BlockModel.findOne({
        $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
      }).exec();
      chai.expect(blockObject).to.not.be.undefined;
      chai.expect(blockObject).to.not.be.null;
      const users = (await UserModel.find({})) as unknown as UserInterface[];
      chai.expect(users[0].followingCount).to.be.eq(0);
      chai.expect(users[0].followerCount).to.be.eq(0);
      chai.expect(users[1].followingCount).to.be.eq(0);
      chai.expect(users[1].followerCount).to.be.eq(0);
    });
  });

  it("should return error for invalid target", async () => {
    const res = await chai
      .request(app)
      .post("/user/block")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" });
    chai.expect(res.status).to.eql(400);
  });
});
