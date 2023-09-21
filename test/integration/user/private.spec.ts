import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";
import { setupUsers } from "../utils/records";

describe("Private", () => {
  before(setupUsers);

  it("should test john_doe switching to private account", async () => {
    return new Promise<void>((resolve, reject) => {
      chai
        .request(app)
        .post("/user/private")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ state: true })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ _id: MemoryStore.users.user1._id }).exec()) as unknown as UserInterface;
            chai.expect(user.isPrivate).to.be.eq(true);
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should test john_doe switching to public account", async () => {
    return new Promise<void>((resolve, reject) => {
      chai
        .request(app)
        .post("/user/private")
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({ state: false })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ _id: MemoryStore.users.user1._id }).exec()) as unknown as UserInterface;
            chai.expect(user.isPrivate).to.be.eq(false);
            return resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });
});
