import chai from "chai";

import app from "../../../../src";
import UserModel, { UserInterface } from "../../../../src/model/mongo/user";
import MemoryStore from "../../store";
import { setupUsers } from "../../utils/records";

describe("Restrict", () => {
  before(setupUsers);

  it("[POST] should restrict user", () => {
    return chai
      .request(app)
      .post(`/user/admin-api/restrict`)
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
        chai.expect(user2.isRestricted).to.eql(true);
        chai.expect(user2.restrictedBy).to.eql(MemoryStore.users.user1._id);
      });
  });

  it("[POST] should un-restrict user", () => {
    return chai
      .request(app)
      .post(`/user/admin-api/restrict`)
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
        chai.expect(user2.isRestricted).to.eql(false);
        chai.expect(user2.restrictedBy).to.eql(MemoryStore.users.user1._id);
      });
  });
});
