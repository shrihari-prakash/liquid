import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import BlockModel from "../../../src/model/mongo/block";
import UserModel, { IUser } from "../../../src/model/mongo/user";
import { setupUsers } from "../utils/records";

describe("Block", () => {
  before(setupUsers);

  describe("should test john_doe blocking rick_asthley", () => {
    it("run follow actions", () => {
      return new Promise<void>(async (resolve, reject) => {
        chai
          .request(app)
          .post("/user/follow")
          .set({ Authorization: `Bearer rick_asthley_access_token` })
          .send({ target: (MemoryStore.users.user1 as any)._id })
          .then(async () => {
            chai
              .request(app)
              .post("/user/follow")
              .set({ Authorization: `Bearer john_doe_access_token` })
              .send({ target: (MemoryStore.users.user2 as any)._id })
              .then(async () => {
                try {
                  const users = (await UserModel.find({})) as unknown as IUser[];
                  chai.expect(users[0].followingCount).to.be.eq(1);
                  chai.expect(users[0].followerCount).to.be.eq(1);
                  chai.expect(users[1].followingCount).to.be.eq(1);
                  chai.expect(users[1].followerCount).to.be.eq(1);
                  resolve();
                } catch (e) {
                  reject(e);
                }
              });
          });
      });
    });

    it("should block rick_asthley", () => {
      return new Promise<void>(async (resolve, reject) => {
        chai
          .request(app)
          .post("/user/block")
          .set({ Authorization: `Bearer john_doe_access_token` })
          .send({ target: (MemoryStore.users.user2 as any)._id })
          .then(async (res) => {
            try {
              chai.expect(res.status).to.eql(200);
              const blockObject = await BlockModel.findOne({
                $and: [
                  { targetId: (MemoryStore.users.user2 as any)._id },
                  { sourceId: (MemoryStore.users.user1 as any)._id },
                ],
              }).exec();
              chai.expect(blockObject).to.not.be.undefined;
              chai.expect(blockObject).to.not.be.null;
              const users = (await UserModel.find({})) as unknown as IUser[];
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
  });

  it("should return error for invalid target", () => {
    return chai
      .request(app)
      .post("/user/block")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });
});
