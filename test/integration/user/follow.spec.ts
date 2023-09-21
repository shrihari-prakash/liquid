import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import FollowModel from "../../../src/model/mongo/follow";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";
import { setupUsers } from "../utils/records";

describe("Follow", () => {
  before(setupUsers);

  it("should set status to requested when following a private account", async () => {
    return new Promise<void>(async (resolve, reject) => {
      await UserModel.updateOne({ _id: (MemoryStore.users.user2 as any)._id }, { $set: { isPrivate: true } });
      chai
        .request(app)
        .post("/user/follow")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ target: (MemoryStore.users.user2 as any)._id })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const followObject = await FollowModel.findOne({
              $and: [
                { targetId: (MemoryStore.users.user2 as any)._id },
                { sourceId: (MemoryStore.users.user1 as any)._id },
              ],
            }).exec();
            chai.expect(followObject).to.not.be.undefined;
            chai.expect(followObject).to.not.be.null;
            chai.expect(followObject?.approved).to.be.false;
            const users = (await UserModel.find({})) as unknown as UserInterface[];
            chai.expect(users[0].followingCount).to.be.eq(0);
            chai.expect(users[0].followerCount).to.be.eq(0);
            chai.expect(users[1].followingCount).to.be.eq(0);
            chai.expect(users[1].followerCount).to.be.eq(0);
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should accept follow request and add followers", () => {
    return new Promise<void>(async (resolve, reject) => {
      const followObject = await FollowModel.findOne({
        $and: [{ targetId: (MemoryStore.users.user2 as any)._id }, { sourceId: (MemoryStore.users.user1 as any)._id }],
      }).exec();
      chai
        .request(app)
        .patch("/user/accept-follow-request")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send({ request: (followObject as any)._id })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const followObject = await FollowModel.findOne({
              $and: [
                { targetId: (MemoryStore.users.user2 as any)._id },
                { sourceId: (MemoryStore.users.user1 as any)._id },
              ],
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
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should test john_doe following rick_asthley", async () => {
    return new Promise<void>((resolve, reject) => {
      chai
        .request(app)
        .post("/user/follow")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ target: (MemoryStore.users.user2 as any)._id })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const followObject = await FollowModel.findOne({
              $and: [
                { targetId: (MemoryStore.users.user2 as any)._id },
                { sourceId: (MemoryStore.users.user1 as any)._id },
              ],
            }).exec();
            chai.expect(followObject).to.not.be.undefined;
            chai.expect(followObject).to.not.be.null;
            chai.expect(followObject?.approved).to.be.true;
            const users = (await UserModel.find({})) as unknown as UserInterface[];
            chai.expect(users[0].followingCount).to.be.eq(1);
            chai.expect(users[0].followerCount).to.be.eq(0);
            chai.expect(users[1].followingCount).to.be.eq(0);
            chai.expect(users[1].followerCount).to.be.eq(1);
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should test following api", () => {
    return chai
      .request(app)
      .get("/user/following")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.body.data.records.length).to.be.eq(1);
        chai.expect(res.body.data.records[0].email === (MemoryStore.users.user2 as any).email);
      });
  });

  it("should test followers api", () => {
    return chai
      .request(app)
      .get("/user/followers")
      .set({ Authorization: `Bearer rick_asthley_access_token` })
      .then(async (res) => {
        chai.expect(res.body.data.records.length).to.be.eq(1);
        chai.expect(res.body.data.records[0].email === (MemoryStore.users.user1 as any).email);
      });
  });

  it("should return error for invalid target", () => {
    return chai
      .request(app)
      .post("/user/follow")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });
});
