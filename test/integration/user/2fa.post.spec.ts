import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("2fa.post", () => {
  before(setupUsers);

  it("should test john_doe switching on 2FA", async () => {
    const res = await chai
      .request(app)
      .post("/user/2fa")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ state: true });
    chai.expect(res.status).to.eql(200);
    const user = (await UserModel.findOne({
      _id: MemoryStore.users.user1._id,
    }).exec()) as unknown as UserInterface;
    chai.expect(user["2faEnabled"]).to.be.eq(true);
    chai.expect(user["2faMedium"]).to.be.eq("email");
  });

  it("should test john_doe switching off 2FA", async () => {
    const res = await chai
      .request(app)
      .post("/user/2fa")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .send({ state: false });
    chai.expect(res.status).to.eql(200);
    const user = (await UserModel.findOne({
      _id: MemoryStore.users.user1._id,
    }).exec()) as unknown as UserInterface;
    chai.expect(user["2faEnabled"]).to.be.eq(false);
  });
});
