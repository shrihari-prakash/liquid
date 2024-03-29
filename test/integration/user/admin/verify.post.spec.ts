import chai from "chai";
import "chai-http";

import app from "../../../../src/index";
import UserModel, { UserInterface } from "../../../../src/model/mongo/user";

import MemoryStore from "../../store";
import { setupUsers } from "../../utils/records";

describe("admin-api.verify.post", () => {
  before(setupUsers);

  it("should verify user", () => {
    return chai
      .request(app)
      .post(`/user/admin-api/verify`)
      .send({
        target: MemoryStore.users.user2._id,
        state: true,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const user2: any = (await UserModel.findOne({
          _id: MemoryStore.users.user2._id,
        })) as unknown as UserInterface[];
        chai.expect(user2.verified).to.eql(true);
        chai.expect(user2.verifiedBy).to.eql(MemoryStore.users.user1._id);
      });
  });

  it("should un-verify user", () => {
    return chai
      .request(app)
      .post(`/user/admin-api/verify`)
      .send({
        target: MemoryStore.users.user2._id,
        state: false,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const user2: any = (await UserModel.findOne({
          _id: MemoryStore.users.user2._id,
        })) as unknown as UserInterface[];
        chai.expect(user2.verified).to.eql(false);
        chai.expect(user2.verifiedBy).to.eql(MemoryStore.users.user1._id);
      });
  });
});
