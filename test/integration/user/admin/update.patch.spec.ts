import chai from "chai";
import "chai-http";

import app from "../../../../src/index";
import UserModel, { UserInterface } from "../../../../src/model/mongo/user";
import MemoryStore from "../../store";
import { setupUsers } from "../../utils/records";
import { Configuration } from "../../../../src/singleton/configuration";

describe("admin-api.patch.post", () => {
  before(setupUsers);

  it("should edit first name and last name for rick_asthley", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "Ric",
        lastName: "Ash",
      };
      Configuration.set("admin-api.user.profile.can-edit-peer-data", true);
      return chai
        .request(app)
        .patch(`/user/admin-api/update`)
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({
          target: MemoryStore.users.user2._id,
          ...u,
        })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.firstName).to.eql(u.firstName);
            chai.expect(user.lastName).to.eql(u.lastName);
            await UserModel.updateOne(
              { username: "rick_asthley" },
              { firstName: MemoryStore.users.user2.firstName, lastName: MemoryStore.users.user2.lastName },
            );
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should NOT edit first name and last name for rick_asthley for invalid inputs", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "",
        lastName: "",
      };
      Configuration.set("admin-api.user.profile.can-edit-peer-data", true);
      return chai
        .request(app)
        .patch(`/user/admin-api/update`)
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({
          target: MemoryStore.users.user2._id,
          ...u,
        })
        .then(async (res) => {
          try {
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(res.status).to.eql(400);
            chai.expect(user.firstName).to.eql(MemoryStore.users.user2.firstName);
            chai.expect(user.lastName).to.eql(MemoryStore.users.user2.lastName);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should return error for invalid role", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        role: "invalid_role",
      };
      Configuration.set("admin-api.user.profile.can-edit-peer-data", true);
      Configuration.set("admin-api.user.profile.editable-fields", ["role"]);
      await UserModel.updateOne({ username: "john_doe" }, { role: "admin" });
      await UserModel.updateOne({ username: "rick_asthley" }, { role: "user" });
      return chai
        .request(app)
        .patch(`/user/admin-api/update`)
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({
          target: MemoryStore.users.user2._id,
          ...u,
        })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(400);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit role for rick_asthley", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        role: "admin",
      };
      Configuration.set("admin-api.user.profile.can-edit-peer-data", true);
      Configuration.set("admin-api.user.profile.editable-fields", ["role"]);
      await UserModel.updateOne({ username: "john_doe" }, { role: "admin" });
      await UserModel.updateOne({ username: "rick_asthley" }, { role: "user" });
      return chai
        .request(app)
        .patch(`/user/admin-api/update`)
        .set({ Authorization: `Bearer john_doe_access_token` })
        .send({
          target: MemoryStore.users.user2._id,
          ...u,
        })
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.role).to.eql(u.role);
            await UserModel.updateOne({ username: "rick_asthley" }, { role: "user" });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });
});

