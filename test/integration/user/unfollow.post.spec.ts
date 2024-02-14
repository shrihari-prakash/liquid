import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";
import FollowModel from "../../../src/model/mongo/follow";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("unfollow.post", () => {
  before(setupUsers);

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

  it("should test john_doe unfollowing rick_asthley", async () => {
    const res = await chai
      .request(app)
      .post("/user/unfollow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(res.status).to.eql(200);
    const followObject = await FollowModel.findOne({
      $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
    }).exec();
    chai.expect(followObject).to.be.null;
    const users = (await UserModel.find({})) as unknown as UserInterface[];
    chai.expect(users[0].followingCount).to.be.eq(0);
    chai.expect(users[0].followerCount).to.be.eq(1);
    chai.expect(users[1].followingCount).to.be.eq(1);
    chai.expect(users[1].followerCount).to.be.eq(0);
  });

  it("should return error for invalid target", async () => {
    const res = await chai
      .request(app)
      .post("/user/unfollow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" });
    chai.expect(res.status).to.eql(400);
  });
});
