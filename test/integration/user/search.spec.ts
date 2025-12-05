import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../../src/index.js";
import { setupUsers } from "../utils/records.js";
import MemoryStore from "../store.js";
import { Configuration } from "../../../src/singleton/configuration.js";

chai.use(chaiHttp);

describe("User Search Integration", () => {
  before(async () => {
    await setupUsers();
    Configuration.set("user.search-results.limit", 10);
    Configuration.set("user.search.search-fields", ["username", "email", "firstName", "lastName", "role"]);
    Configuration.set("user.search.strict-match-fields", ["role"]);
  });

  it("should perform quick search", async () => {
    const user = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({ query: user.username });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results.length).to.be.greaterThan(0);
    expect(res.body.data.results[0].username).to.equal(user.username);
  });

  it("should perform object query search", async () => {
    const user = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({ query: { username: user.username } });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results[0].username).to.equal(user.username);
  });

  it("should perform object query search with operator", async () => {
    const user = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({ query: { username: { $eq: user.username } } });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results[0].username).to.equal(user.username);
  });

  it("should fail validation for disallowed field in object query", async () => {
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({ query: { password: "123" } });

    expect(res).to.have.status(400);
  });

  it("should fail validation for disallowed operator in object query", async () => {
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({ query: { username: { $where: "true" } } });

    expect(res).to.have.status(400);
  });
  it("should perform object query search with $or operator", async () => {
    const user1 = MemoryStore.users.user1;
    const user2 = MemoryStore.users.user2;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          $or: [{ username: user1.username }, { username: user2.username }],
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results.length).to.be.greaterThan(1);
    const usernames = res.body.data.results.map((u: any) => u.username);
    expect(usernames).to.include(user1.username);
    expect(usernames).to.include(user2.username);
  });

  it("should perform object query search with $and operator", async () => {
    const user = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          $and: [{ username: user.username }, { email: user.email }],
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results.length).to.equal(1);
    expect(res.body.data.results[0].username).to.equal(user.username);
  });
  it("should perform object query search with $in operator", async () => {
    const user1 = MemoryStore.users.user1;
    const user2 = MemoryStore.users.user2;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          username: { $in: [user1.username, user2.username] },
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results.length).to.be.greaterThan(1);
    const usernames = res.body.data.results.map((u: any) => u.username);
    expect(usernames).to.include(user1.username);
    expect(usernames).to.include(user2.username);
  });

  it("should perform object query search with $nin operator", async () => {
    const user1 = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          username: { $nin: [user1.username] },
        },
      });

    expect(res).to.have.status(200);
    const usernames = res.body.data.results.map((u: any) => u.username);
    expect(usernames).to.not.include(user1.username);
  });

  it("should perform object query search with $gt and $lt operators", async () => {
    // Temporarily allow followerCount for this test
    const originalFields = Configuration.get("user.search.search-fields");
    Configuration.set("user.search.search-fields", [...originalFields, "followerCount"]);

    try {
      const res = await chai
        .request(app)
        .post("/user/search")
        .set("Authorization", `Bearer john_doe_access_token`)
        .send({
          query: {
            followerCount: { $gte: 0 },
          },
        });

      expect(res).to.have.status(200);
      expect(res.body.data.results).to.be.an("array");
    } finally {
      // Restore configuration
      Configuration.set("user.search.search-fields", originalFields);
    }
  });
  it("should perform object query search with $regex operator", async () => {
    const user = MemoryStore.users.user1;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          username: { $regex: "^john", $options: "i" },
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results.length).to.be.greaterThan(0);
    expect(res.body.data.results[0].username).to.equal(user.username);
  });
  it("should perform object query search with nested operators", async () => {
    const user1 = MemoryStore.users.user1;
    const user2 = MemoryStore.users.user2;
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          $or: [
            { username: user1.username },
            {
              $and: [{ email: user2.email }, { role: "user" }],
            },
          ],
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results.length).to.be.greaterThan(1);
    const usernames = res.body.data.results.map((u: any) => u.username);
    expect(usernames).to.include(user1.username);
    expect(usernames).to.include(user2.username);
  });
  it("should return empty array when no results found", async () => {
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          username: "non_existent_user_12345",
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results).to.be.empty;
  });

  it("should handle special characters in query", async () => {
    const res = await chai
      .request(app)
      .post("/user/search")
      .set("Authorization", `Bearer john_doe_access_token`)
      .send({
        query: {
          username: { $regex: "^.*$", $options: "i" },
        },
      });

    expect(res).to.have.status(200);
    expect(res.body.data.results).to.be.an("array");
    expect(res.body.data.results.length).to.be.greaterThan(0);
  });
});

