import chai from "chai";

import app from "../../../../src";
import UserModel, { UserInterface } from "../../../../src/model/mongo/user";
import MemoryStore from "../../store";
import { setupUsers } from "../../utils/records";
import { Configuration } from "../../../../src/singleton/configuration";

describe("Subscriptions", () => {
  before(setupUsers);

  it("[POST] should add subscription to user", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return chai
      .request(app)
      .post(`/user/admin-api/subscription`)
      .send({
        target: MemoryStore.users.user2._id,
        state: true,
        tier: "premium",
        expiry: tomorrow.toISOString(),
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        const user2: any = (await UserModel.findOne({
          _id: MemoryStore.users.user2._id,
        })) as unknown as UserInterface[];
        chai.expect(user2.isSubscribed).to.eql(true);
        chai.expect(user2.subscriptionTier).to.eql("premium");
        chai.expect(user2.subscriptionExpiry.toISOString()).to.eql(tomorrow.toISOString());
      });
  });

  it("[POST] should revert to basic subscription if date is expired", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return chai
      .request(app)
      .post(`/user/admin-api/subscription`)
      .send({
        target: MemoryStore.users.user2._id,
        state: true,
        tier: "premium",
        expiry: yesterday.toISOString(),
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then(async (res) => {
        chai.expect(res.status).to.eql(200);
        return chai
          .request(app)
          .get("/user/admin-api/user-info?targets=" + MemoryStore.users.user2._id)
          .set({ Authorization: `Bearer john_doe_access_token` })
          .then((res) => {
            const user2: any = res.body.data.users[0];
            chai.expect(user2.isSubscribed).to.eql(false);
            chai.expect(user2.subscriptionTier).to.eql("basic");
            chai.expect(user2.subscriptionExpiry).to.eql(yesterday.toISOString());
          });
      });
  });

  it("[POST] should fail for invalid subscription tier", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return chai
      .request(app)
      .post(`/user/admin-api/subscription`)
      .send({
        target: MemoryStore.users.user2._id,
        state: true,
        tier: "invalid",
        expiry: yesterday.toISOString(),
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });

  it("[POST] should fail for invalid state", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return chai
      .request(app)
      .post(`/user/admin-api/subscription`)
      .send({
        target: MemoryStore.users.user2._id,
        state: "invalid",
        tier: "premium",
        expiry: yesterday.toISOString(),
      })
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        chai.expect(res.status).to.eql(400);
      });
  });

  it("[GET] should get subscription tiers", () => {
    return chai
      .request(app)
      .get("/user/admin-api/subscription-tiers")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        const tiers: any = res.body.data.subscriptionTiers;
        chai.expect(tiers[0].name).to.eql("basic");
        chai.expect(tiers[0].isBaseTier).to.eql(true);
        chai.expect(tiers[1].name).to.eql("premium");
        chai.expect(tiers[1].isBaseTier).to.eql(false);
      });
  });

  it("[GET] should get subscription tiers for different option value", () => {
    Configuration.set("user.subscription.tier-list", "pro,starter,ultra");
    Configuration.set("user.subscription.base-tier", "starter");
    return chai
      .request(app)
      .get("/user/admin-api/subscription-tiers")
      .set({ Authorization: `Bearer john_doe_access_token` })
      .then((res) => {
        const tiers: any = res.body.data.subscriptionTiers;
        chai.expect(tiers[0].name).to.eql("pro");
        chai.expect(tiers[0].isBaseTier).to.eql(false);
        chai.expect(tiers[1].name).to.eql("starter");
        chai.expect(tiers[1].isBaseTier).to.eql(true);
        chai.expect(tiers[2].name).to.eql("ultra");
        chai.expect(tiers[2].isBaseTier).to.eql(false);
      });
  });
});
