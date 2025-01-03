import chai from "chai";
import "chai-http";

import app from "../../../../src";
import { setupUsers } from "../../utils/records";

describe("roles.create.post", () => {
  before(setupUsers);

  it("should create a role", async () => {
    const role = {
      id: "test",
      displayName: "Test",
      ranking: 1,
      description: "Test role",
    };
    const res = await chai
      .request(app)
      .post(`/roles/admin-api/create`)
      .send(role)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.role.id).to.eql(role.id);
    chai.expect(res.body.data.role.displayName).to.eql(role.displayName);
    chai.expect(res.body.data.role.description).to.eql(role.description);
    chai.expect(res.body.data.role.ranking).to.eql(role.ranking);
  });

  it("should set scope to empty array if passed in request body", async () => {
    const role = {
      id: "test1",
      displayName: "Test 1",
      ranking: 1,
      description: "Test role 1",
      scope: ["*"],
    };
    const res = (
      await chai.request(app).post(`/roles/admin-api/create`).send(role).set({ Authorization: `Bearer john_doe_access_token` })
    );
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.role.scope).to.eql([]);
  });

  it("should not allow invalid name", async () => {
    const role = {
      id: "test 1",
      displayName: "Test 1",
      ranking: 1,
      description: "Test role 1",
      scope: ["*"],
    };
    const res = (
      await chai.request(app).post(`/roles/admin-api/create`).send(role).set({ Authorization: `Bearer john_doe_access_token` })
    );
    chai.expect(res.status).to.eql(400);
  });
});

