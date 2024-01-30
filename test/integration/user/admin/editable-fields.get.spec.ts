import chai from "chai";
import "chai-http";

import app from "../../../../src";
import { Configuration } from "../../../../src/singleton/configuration";

import { setupUsers } from "../../utils/records";

describe("editable-fields.get", () => {
  before(setupUsers);

  it("should get proper editable fields", () => {
    return chai
      .request(app)
      .get("/user/admin-api/editable-fields")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        chai.expect(res.status).to.eql(200);
        chai.expect(res.body.data.editableFields).to.eql(Configuration.get("admin-api.user.profile.editable-fields"));
      });
  });
});
