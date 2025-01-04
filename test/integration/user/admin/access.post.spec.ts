import chai, { expect } from "chai";
import "chai-http";

import app from "../../../../src";
import MemoryStore from "../../store";
import UserModel, { UserInterface } from "../../../../src/model/mongo/user";
import { setupUsers } from "../../utils/records";
import TokenModel from "../../../../src/model/mongo/token";
import ClientModel from "../../../../src/model/mongo/client";
import RoleModel from "../../../../src/model/mongo/role";

describe("admin-api.access.post", () => {
  before(setupUsers);

  it("should provide passed access to users", async () => {
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["delegated:social:follow:read", "delegated:profile:write"],
        operation: "add",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const user2: any = (await UserModel.findOne({
      _id: MemoryStore.users.user2._id,
    })) as unknown as UserInterface[];
    chai.expect(user2.scope.includes("delegated:social:follow:read")).to.eql(true);
    chai.expect(user2.scope.includes("delegated:profile:write")).to.eql(true);
  });

  it("should remove passed access from users", async () => {
    await UserModel.updateOne({ _id: MemoryStore.users.user2._id }, { $set: { scope: ["delegated:profile:write"] } });
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["delegated:social:follow:read"],
        operation: "del",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const user2: any = (await UserModel.findOne({
      _id: MemoryStore.users.user2._id,
    })) as unknown as UserInterface[];
    chai.expect(user2.scope.includes("delegated:social:follow:read")).to.eql(false);
    chai.expect(user2.scope.includes("delegated:profile:write")).to.eql(true);
  });

  it("should replace scope", async () => {
    await UserModel.updateOne({ _id: MemoryStore.users.user2._id }, { $set: { scope: ["delegated:profile:write"] } });
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["delegated:all", "admin:profile:write"],
        operation: "set",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const user2: any = (await UserModel.findOne({
      _id: MemoryStore.users.user2._id,
    })) as unknown as UserInterface[];
    chai.expect(user2.scope).to.eql(["delegated:all", "admin:profile:write"]);
  });

  it("should fail for invalid scope", async () => {
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["invalid_scope"],
        operation: "set",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(400);
  });

  it("should fail when source user does not have access to scope", async () => {
    await TokenModel.updateOne(
      { accessToken: "john_doe_access_token" },
      { $set: { scope: ["delegated:profile:write"] } }
    );
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.users.user2._id],
        targetType: "user",
        scope: ["admin:all"],
        operation: "add",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(401);
  });

  it("should update for target type client", async () => {
    await TokenModel.updateOne({ accessToken: "john_doe_access_token" }, { $set: { scope: ["*"] } });
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: [MemoryStore.client._id],
        targetType: "client",
        scope: ["client:all"],
        operation: "add",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const client = (await ClientModel.findOne({ _id: MemoryStore.client._id })) as any;
    chai.expect(client.scope.includes("client:all")).to.eql(true);
  });

  it("should update for target type role", async () => {
    await TokenModel.updateOne({ accessToken: "john_doe_access_token" }, { $set: { scope: ["*"] } });
    const res = await chai
      .request(app)
      .post(`/user/admin-api/access`)
      .send({
        targets: ["admin"],
        targetType: "role",
        scope: ["client:all", "admin:all", "delegated:all"],
        operation: "add",
      })
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const role = (await RoleModel.findOne({ id: "admin" })) as any;
    expect(role.scope.includes("client:all")).to.eql(true);
    expect(role.scope.includes("admin:all")).to.eql(true);
    expect(role.scope.includes("delegated:all")).to.eql(true);
  });
});
