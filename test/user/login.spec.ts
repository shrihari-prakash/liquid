import app from "../../src/index";
import chai from "chai";
import { user1 } from "./create.spec";

it("should login user john_doe", () => {
  return chai
    .request(app)
    .post("/user/login")
    .send(user1)
    .then((res) => {
      chai.expect(res.status).to.eql(200);
    });
});

it("should not login with wrong credentials", () => {
  return chai
    .request(app)
    .post("/user/login")
    .send({ username: "john_doe", password: "password" })
    .then((res) => {
      chai.expect(res.status).to.eql(401);
    });
});
