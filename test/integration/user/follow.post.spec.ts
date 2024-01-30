import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import FollowModel from "../../../src/model/mongo/follow";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("follow.post", () => {
  before(setupUsers);

  it("should set status to requested when following a private account", async () => {
    await UserModel.updateOne({ _id: (MemoryStore.users.user2 as any)._id }, { $set: { isPrivate: true } });
    const res = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(res.status).to.eql(200);
    const followObject = await FollowModel.findOne({
      $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
    }).exec();
    chai.expect(followObject).to.not.be.undefined;
    chai.expect(followObject).to.not.be.null;
    chai.expect(followObject?.approved).to.be.false;
    const users = (await UserModel.find({})) as unknown as UserInterface[];
    chai.expect(users[0].followingCount).to.be.eq(0);
    chai.expect(users[0].followerCount).to.be.eq(0);
    chai.expect(users[1].followingCount).to.be.eq(0);
    chai.expect(users[1].followerCount).to.be.eq(0);
  });

  it("should accept follow request and add followers", async () => {
    const requestObject = await FollowModel.findOne({
      $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
    }).exec();
    const res = await chai
      .request(app)
      .patch("/user/follow-request")
      .set({ Authorization: `Bearer rick_asthley_access_token` })
      .send({ request: (requestObject as any)._id });
    chai.expect(res.status).to.eql(200);
    const followObject = await FollowModel.findOne({
      $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
    }).exec();
    chai.expect(followObject).to.not.be.undefined;
    chai.expect(followObject).to.not.be.null;
    chai.expect(followObject?.approved).to.be.true;
    const users = (await UserModel.find({})) as unknown as UserInterface[];
    chai.expect(users[0].followingCount).to.be.eq(1);
    chai.expect(users[0].followerCount).to.be.eq(0);
    chai.expect(users[1].followingCount).to.be.eq(0);
    chai.expect(users[1].followerCount).to.be.eq(1);
    await UserModel.updateMany({}, { $set: { followerCount: 0 } });
    await UserModel.updateMany({}, { $set: { followingCount: 0 } });
    await UserModel.updateOne({ _id: (MemoryStore.users.user2 as any)._id }, { $set: { isPrivate: false } });
    await FollowModel.deleteMany({});
  });

  it("should test john_doe following rick_asthley", async () => {
    const res = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: (MemoryStore.users.user2 as any)._id });
    chai.expect(res.status).to.eql(200);
    const followObject = await FollowModel.findOne({
      $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
    }).exec();
    chai.expect(followObject).to.not.be.undefined;
    chai.expect(followObject).to.not.be.null;
    chai.expect(followObject?.approved).to.be.true;
    const users = (await UserModel.find({})) as unknown as UserInterface[];
    chai.expect(users[0].followingCount).to.be.eq(1);
    chai.expect(users[0].followerCount).to.be.eq(0);
    chai.expect(users[1].followingCount).to.be.eq(0);
    chai.expect(users[1].followerCount).to.be.eq(1);
  });

  it("should return error for invalid target", async () => {
    const res = await chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" });
    chai.expect(res.status).to.eql(400);
  });
});
