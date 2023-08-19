import chai from "chai";
import app from "../../../src";
import TokenModel from "../../../src/model/mongo/token";
import UserModel from "../../../src/model/mongo/user";
import VerificationCodeModel from "../../../src/model/mongo/verification-code";
import MemoryStore from "../store";
import FollowModel from "../../../src/model/mongo/follow";
import BlockModel from "../../../src/model/mongo/block";
import ClientModel from "../../../src/model/mongo/client";

export const MockData = JSON.parse(JSON.stringify(MemoryStore));

export const setupUsers = async () => {
  await UserModel.deleteMany({});
  await TokenModel.deleteMany({});
  await FollowModel.deleteMany({});
  await BlockModel.deleteMany({});
  await ClientModel.deleteMany({});
  await VerificationCodeModel.deleteMany({});

  try {
    await chai.request(app).post("/user/create").send(MemoryStore.users.user1);
    await chai.request(app).post("/user/create").send(MemoryStore.users.user2);
  } catch (err) {
    console.error(err);
  }

  const users = await UserModel.find({});

  const user1password = MemoryStore.users.user1.password;
  (MemoryStore.users.user1 as any) = users[0];
  MemoryStore.users.user1.password = user1password;
  MemoryStore.users.user1._id = (MemoryStore.users.user1._id as any).toString();
  MemoryStore.users.user1.scope = ["*"];

  const user2password = MemoryStore.users.user2.password;
  (MemoryStore.users.user2 as any) = users[1];
  MemoryStore.users.user2.password = user2password;
  MemoryStore.users.user2._id = (MemoryStore.users.user2._id as any).toString();
  MemoryStore.users.user1.scope = ["*"];

  await UserModel.updateOne({ email: MemoryStore.users.user1.email }, { $set: { emailVerified: true, scope: ["*"] } });
  await UserModel.updateOne({ email: MemoryStore.users.user2.email }, { $set: { emailVerified: true, scope: ["*"] } });

  const token1 = {
    accessToken: "john_doe_access_token",
    authorizationCode: "john_doe_auth_code",
    accessTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    refreshToken: "john_doe_refresh_token",
    refreshTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    scope: ["*"],
    client: { ...MemoryStore.client },
    user: MemoryStore.users.user1,
  };
  await new TokenModel(token1).save();
  const token2 = {
    accessToken: "rick_asthley_access_token",
    authorizationCode: "rick_asthley_auth_code",
    accessTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    refreshToken: "rick_asthley_refresh_token",
    refreshTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    scope: ["*"],
    client: { ...MemoryStore.client },
    user: MemoryStore.users.user2,
  };
  await new TokenModel(token2).save();
  await new ClientModel(MemoryStore.client).save();
};
