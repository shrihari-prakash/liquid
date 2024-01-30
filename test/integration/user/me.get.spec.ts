import chai from "chai";
import "chai-http";

import app from "../../../src/index";

import MemoryStore from "../store";
import { setupUsers } from "../utils/records";

describe("me.get", () => {
  before(setupUsers);

  it("should get user john_doe", () => {
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

  it("should get user rick_asthley", () => {
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
});
