import chai from "chai";

import app from "../../../../src";
import MemoryStore from "../../store";
import UserModel, { IUser } from "../../../../src/model/mongo/user";
import { setupUsers } from "../../utils/records";
import TokenModel from "../../../../src/model/mongo/token";
import ClientModel from "../../../../src/model/mongo/client";

describe("Access", () => {
  before(setupUsers);

  it("[POST] should provide passed access to users", () => {
    return chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["delegated:social:follow:read", "delegated:profile:write"],
        status: true,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const user2 = (await UserModel.findOne({ _id: MemoryStore.users.user2._id })) as unknown as IUser[];
        // @ts-ignore
        chai.expect(user2.scope.includes("delegated:social:follow:read")).to.eql(true);
        // @ts-ignore
        chai.expect(user2.scope.includes("delegated:profile:write")).to.eql(true);
      });
  });

  it("[POST] should remove passed access from users", async () => {
    await UserModel.updateOne(
      { _id: MemoryStore.users.user2._id },
      { $set: { scope: ["delegated:profile:write"] } }
    );
    return chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["delegated:social:follow:read"],
        status: false,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const user2 = (await UserModel.findOne({ _id: MemoryStore.users.user2._id })) as unknown as IUser[];
        // @ts-ignore
        chai.expect(user2.scope.includes("delegated:social:follow:read")).to.eql(false);
        // @ts-ignore
        chai.expect(user2.scope.includes("delegated:profile:write")).to.eql(true);
      });
  });

  it("[POST] should fail for invalid scope", async () => {
    return chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["invalid_scope"],
        status: true,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(400);
      });
  });

  it("[POST] should fail when source user does not have access to scope", async () => {
    await TokenModel.updateOne(
      { accessToken: "john_doe_access_token" },
      { $set: { scope: ["delegated:profile:write"] } }
    );
    return chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["admin:all"],
        status: true,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it("[POST] should update for target type client", async () => {
    await TokenModel.updateOne({ accessToken: "john_doe_access_token" }, { $set: { scope: ["*"] } });
    return chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.client._id],
        targetType: "client",
        scope: ["client:all"],
        status: true,
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const client = (await ClientModel.findOne({ _id: MemoryStore.client._id })) as any;
        chai.expect(client.scope.includes("client:all")).to.eql(true);
      });
  });
});
