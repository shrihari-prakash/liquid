import chai from "chai";
import "chai-http";

import app from "../../../../src";
import { setupUsers } from "../../utils/records";

describe("roles.delete.delete", () => {
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

  it("should delete a role", async () => {
    const role = {
      target: "test",
    };
    const res = await chai
      .request(app)
      .delete(`/roles/admin-api/delete`)
      .send(role)
      .set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    const list = await chai.request(app).get(`/roles/list`).set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(list.body.data.roles.find((r: any) => r.id === role.target)).to.be.undefined;
  });
});

