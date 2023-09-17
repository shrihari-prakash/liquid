import app from "../../../src/index";
import chai from "chai";
import MemoryStore from "../store";
import { setupUsers } from "../utils/records";
import UserModel, { UserInterface } from "../../../src/model/mongo/user";

describe("Me", () => {
  before(setupUsers);

  it("[GET] should get user john_doe", () => {
    return chai
      .request(app)
      .get("/user/me")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        const user = MemoryStore.users.user1;
        chai.expect(res.status).to.eql(200);
        chai.expect(res.body.data.user.email).to.eql(user.email);
        chai.expect(res.body.data.user.firstName).to.eql(user.firstName);
        chai.expect(res.body.data.user.lastName).to.eql(user.lastName);
      });
  });

  it("[GET] should get user rick_asthley", () => {
    return chai
      .request(app)
      .get("/user/me")
      .set({ Authorization: `Bearer rick_asthley_access_token` })
      .then((res) => {
        const user = MemoryStore.users.user2;
        chai.expect(res.status).to.eql(200);
        chai.expect(res.body.data.user.email).to.eql(user.email);
        chai.expect(res.body.data.user.firstName).to.eql(user.firstName);
        chai.expect(res.body.data.user.lastName).to.eql(user.lastName);
      });
  });

  it("[PATCH] should NOT edit first name and last name for rick_asthley for invalid inputs", () => {
    return new Promise<void>(async (resolve, reject) => {
      const u = {
        firstName: "R",
        lastName: "A",
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

  it("[PATCH] should edit first name and last name for rick_asthley", () => {
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

  it("[PATCH] should edit first name and last name for rick_asthley", () => {
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

  it("[PATCH] should NOT edit username rick_asthley without it being in the configuration", () => {
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

  it("[PATCH] should NOT edit username rick_asthley for invalid username", () => {
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

  it("[PATCH] should edit username rick_asthley for valid username", () => {
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

  it("[PATCH] should NOT edit email rick_asthley without it being in the configuration", () => {
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

  it("[PATCH] should NOT edit email rick_asthley for invalid email", () => {
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

  it("[PATCH] should edit email rick_asthley for valid email", () => {
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
});
