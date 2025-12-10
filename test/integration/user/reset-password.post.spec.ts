import chai from "chai";
import "chai-http";

import app from "../../../src/index";
import { Configuration } from "../../../src/singleton/configuration";
import VerificationCodeModel from "../../../src/model/mongo/verification-code";
import UserModel from "../../../src/model/mongo/user";
import { MockData } from "../utils/records";
import { VerificationCodeType } from "../../../src/enum/verification-code";

describe("reset-password.post", () => {
  let user: any;
  let code: any;

  before(async () => {
    user = await UserModel.findOne({ username: MockData.users.user1.username });
    code = await new VerificationCodeModel({
      belongsTo: user._id,
      code: "123456",
      type: VerificationCodeType.PASSWORD_RESET,
    }).save();
  });

  afterEach(async () => {
    Configuration.set("user.password-reset.require-current-password", false);
  });

  it("should reset password without current password", async () => {
    const res = await chai.request(app).post("/user/reset-password").send({
      target: user._id,
      code: code.code,
      password: "newpassword123",
    });
    chai.expect(res.status).to.eql(200);
  });

  it("should fail if current password is required but not provided", async () => {
    Configuration.set("user.password-reset.require-current-password", true);
    // Re-create code since it was used in previous test
    code = await new VerificationCodeModel({
      belongsTo: user._id,
      code: "1234567",
      type: VerificationCodeType.PASSWORD_RESET,
    }).save();

    const res = await chai.request(app).post("/user/reset-password").send({
      target: user._id,
      code: code.code,
      password: "newpassword123",
    });
    chai.expect(res.status).to.eql(400);
    chai.expect(res.body.additionalInfo.errors[0].path).to.eql("currentPassword");
  });

  it("should fail if current password is required but incorrect", async () => {
    Configuration.set("user.password-reset.require-current-password", true);
    // Re-create code
    code = await new VerificationCodeModel({
      belongsTo: user._id,
      code: "12345678",
      type: VerificationCodeType.PASSWORD_RESET,
    }).save();

    const res = await chai.request(app).post("/user/reset-password").send({
      target: user._id,
      code: code.code,
      password: "newpassword123",
      currentPassword: "wrongpassword",
    });
    chai.expect(res.status).to.eql(400);
  });

  it("should reset password with correct current password", async () => {
    Configuration.set("user.password-reset.require-current-password", true);
    // Re-create code
    code = await new VerificationCodeModel({
      belongsTo: user._id,
      code: "123456789",
      type: VerificationCodeType.PASSWORD_RESET,
    }).save();

    user.password = await import("bcrypt").then((b) => b.hash(MockData.users.user1.password, 10));
    await user.save();

    const res = await chai.request(app).post("/user/reset-password").send({
      target: user._id,
      code: code.code,
      password: "newpassword123",
      currentPassword: MockData.users.user1.password,
    });
    chai.expect(res.status).to.eql(200);
  });
});

