import chai from "chai";
import "chai-http";

import app from "../../../../src";
import { setupUsers } from "../../utils/records";

describe("roles.update.patch", () => {
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

  it("should update, display name, ranking and description", async () => {
    const role = {
      target: "test",
      displayName: "Test 2",
      ranking: 2,
      description: "Test role 2",
    };
    const res = await chai
      .request(app)
      .patch(`/roles/admin-api/update`)
      .send(role)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.role.displayName).to.eql(role.displayName);
    chai.expect(res.body.data.role.description).to.eql(role.description);
    chai.expect(res.body.data.role.ranking).to.eql(role.ranking);
  });

  it("should not allow scope modifications", async () => {
    const role = {
      target: "test",
      scope: ["admin:all"],
    };
    const res = await chai
      .request(app)
      .patch(`/roles/admin-api/update`)
      .send(role)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.role.scope).to.eql([]);
  });
});

