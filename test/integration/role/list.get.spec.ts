import chai from "chai";
import "chai-http";

import app from "../../../src";
import DefaultRoles from "../../../src/service/role/default-roles.json" assert { type: "json" };
import { setupUsers } from "../utils/records";

describe("roles.list.get", () => {
  before(setupUsers);

  it("should get role list", async () => {
    const res = await chai.request(app).get(`/roles/list`).set({ Authorization: `Bearer john_doe_access_token` });
    chai.expect(res.status).to.eql(200);
    chai.expect(res.body.data.roles.length).to.eql(DefaultRoles.length);
    for (const role of DefaultRoles) {
      const responseRole = res.body.data.roles.find((r: any) => r.id === role.id);
      chai.expect(responseRole).to.not.be.undefined;
      chai.expect(responseRole.id).to.eql(role.id);
      chai.expect(responseRole.displayName).to.eql(role.displayName);
      chai.expect(responseRole.description).to.eql(role.description);
      chai.expect(responseRole.ranking).to.eql(role.ranking);
    }
  });
});

