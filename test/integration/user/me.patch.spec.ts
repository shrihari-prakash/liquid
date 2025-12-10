import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("me.patch", () => {
  before(setupUsers);

  it("should NOT edit first name and last name for rick_asthley for invalid inputs", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "",
        lastName: "",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
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

  it("should edit first name and last name for rick_asthley", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "Ric",
        lastName: "Ash",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.firstName).to.eql(u.firstName);
            chai.expect(user.lastName).to.eql(u.lastName);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit first name and last name for rick_asthley", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "Ric",
        lastName: "Ash",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.firstName).to.eql(u.firstName);
            chai.expect(user.lastName).to.eql(u.lastName);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should NOT edit username rick_asthley without it being in the configuration", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        username: "rick_asth",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(400);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.username).to.eql(MemoryStore.users.user2.username);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should NOT edit username rick_asthley for invalid username", () => {
    return new Promise<void>(async (resolve, reject) => {
      process.env.USER_PROFILE_EDITABLE_FIELDS =
        "firstName,lastName,middleName,password,bio,pronouns,customLink,organization,gender,preferredLanguage,username";
      const u = {
        username: "r*%&^$ick_ash",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(400);
            const user = (await UserModel.findOne({ username: "rick_asthley" })) as unknown as UserInterface;
            chai.expect(user.username).to.eql(MemoryStore.users.user2.username);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit username rick_asthley for valid username", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        username: "rick_asth",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asth" })) as unknown as UserInterface;
            chai.expect(user.username).to.eql(u.username);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should NOT edit email rick_asthley without it being in the configuration", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        email: "rick@example.com",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(400);
            const user = (await UserModel.findOne({ username: "rick_asth" })) as unknown as UserInterface;
            chai.expect(user.email).to.eql(MemoryStore.users.user2.email);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should NOT edit email rick_asthley for invalid email", () => {
    process.env.USER_PROFILE_EDITABLE_FIELDS =
      "firstName,lastName,middleName,password,bio,pronouns,customLink,organization,gender,preferredLanguage,email";
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        email: "rickexample.com",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(400);
            const user = (await UserModel.findOne({ username: "rick_asth" })) as unknown as UserInterface;
            chai.expect(user.email).to.eql(MemoryStore.users.user2.email);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit email rick_asthley for valid email", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        email: "rick@example.com",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asth" })) as unknown as UserInterface;
            chai.expect(user.email).to.eql(u.email);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should fail to edit profile if current password is required but missing for protected field", () => {
    process.env.USER_PROFILE_UPDATE_REQUIRE_CURRENT_PASSWORD = "true";
    process.env.USER_PROFILE_UPDATE_PROTECTED_FIELDS = "password";
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        password: "newpassword",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
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

  it("should fail to edit profile if current password is required but incorrect for protected field", () => {
    process.env.USER_PROFILE_UPDATE_REQUIRE_CURRENT_PASSWORD = "true";
    process.env.USER_PROFILE_UPDATE_PROTECTED_FIELDS = "password";
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        password: "newpassword",
        currentPassword: "wrongpassword",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(401);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit profile if current password is required and correct for protected field", () => {
    process.env.USER_PROFILE_UPDATE_REQUIRE_CURRENT_PASSWORD = "true";
    process.env.USER_PROFILE_UPDATE_PROTECTED_FIELDS = "password";
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        password: "newpassword",
        currentPassword: MemoryStore.users.user2.password,
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });

  it("should edit profile without current password if field is not protected", () => {
    process.env.USER_PROFILE_UPDATE_REQUIRE_CURRENT_PASSWORD = "true";
    process.env.USER_PROFILE_UPDATE_PROTECTED_FIELDS = "password";
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "Rick",
      };
      return chai
        .request(app)
        .patch("/user/me")
        .set({ Authorization: `Bearer rick_asthley_access_token` })
        .send(u)
        .then(async (res) => {
          try {
            chai.expect(res.status).to.eql(200);
            const user = (await UserModel.findOne({ username: "rick_asth" })) as unknown as UserInterface;
            chai.expect(user.firstName).to.eql(u.firstName);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    });
  });
});

