import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import BlockModel from "../../../src/model/mongo/block";

describe("Unblock", () => {
  it("should test john_doe unblocking rick_asthley", async () => {
    return new Promise<void>((resolve, reject) => {
      chai
        .request(app)
        .post("/user/unblock")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ target: (MemoryStore.users.user2 as any)._id })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const followObject = await BlockModel.findOne({
              $and: [
                { targetId: (MemoryStore.users.user2 as any)._id },
                { sourceId: (MemoryStore.users.user1 as any)._id },
              ],
            }).exec();
            chai.expect(followObject).to.be.null;
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should return error for invalid target", () => {
    return chai
      .request(app)
      .post("/user/unblock")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ target: "000000" })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });
});
