import chai from "chai";

import app from "../../../../src";
import { setupUsers } from "../../utils/records";
import { Configuration } from "../../../../src/singleton/configuration";

describe("Editable Fields", () => {
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
