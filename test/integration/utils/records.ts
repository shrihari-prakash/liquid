import chai from "chai";
import "chai-http";

import app from "../../../src";
import TokenModel from "../../../src/model/mongo/token";
import UserModel from "../../../src/model/mongo/user";
import VerificationCodeModel from "../../../src/model/mongo/verification-code";
import MemoryStore from "../store";
import FollowModel from "../../../src/model/mongo/follow";
import BlockModel from "../../../src/model/mongo/block";
import ClientModel from "../../../src/model/mongo/client";
import RoleModel from "../../../src/model/mongo/role";
import { Role } from "../../../src/singleton/role";

export const MockData = JSON.parse(JSON.stringify(MemoryStore));

export const setupUsers = async () => {
  await UserModel.deleteMany({});
  await TokenModel.deleteMany({});
  await FollowModel.deleteMany({});
  await BlockModel.deleteMany({});
  await ClientModel.deleteMany({});
  await VerificationCodeModel.deleteMany({});
  await RoleModel.deleteMany({});

  const mockData = MockData;
  try {
    await chai.request(app).post("/user/create").send(mockData.users.user1);
    await chai.request(app).post("/user/create").send(mockData.users.user2);
    await chai.request(app).post("/user/create").send(mockData.users.user3);
  } catch (err) {
    console.error(err);
  }

  const user1 = await UserModel.findOne({ username: mockData.users.user1.username });
  const user1password = MemoryStore.users.user1.password;
  (MemoryStore.users.user1 as any) = user1;
  MemoryStore.users.user1.password = user1password;
  MemoryStore.users.user1._id = (MemoryStore.users.user1._id as any).toString();
  MemoryStore.users.user1.scope = ["*"];

  const user2 = await UserModel.findOne({ username: mockData.users.user2.username });
  const user2password = MemoryStore.users.user2.password;
  (MemoryStore.users.user2 as any) = user2;
  MemoryStore.users.user2.password = user2password;
  MemoryStore.users.user2._id = (MemoryStore.users.user2._id as any).toString();
  MemoryStore.users.user2.scope = ["*"];

  const user3 = await UserModel.findOne({ username: mockData.users.user3.username });
  const user3password = MemoryStore.users.user3.password;
  (MemoryStore.users.user3 as any) = user3;
  MemoryStore.users.user3.password = user3password;
  MemoryStore.users.user3._id = (MemoryStore.users.user3._id as any).toString();
  MemoryStore.users.user3.scope = ["*"];

  await UserModel.updateOne({ email: MemoryStore.users.user1.email }, { $set: { emailVerified: true, scope: ["*"] } });
  await UserModel.updateOne({ email: MemoryStore.users.user2.email }, { $set: { emailVerified: true, scope: ["*"] } });
  await UserModel.updateOne({ email: MemoryStore.users.user3.email }, { $set: { emailVerified: true, scope: ["*"] } });

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
  const token3 = {
    accessToken: "allisson_brooklyn_access_token",
    authorizationCode: "allisson_brooklyn_access_token",
    accessTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    refreshToken: "allisson_brooklyn_refresh_token",
    refreshTokenExpiresAt: "9999-01-01T00:00:00.000Z",
    scope: ["*"],
    client: { ...MemoryStore.client },
    user: MemoryStore.users.user3,
  };
  await new TokenModel(token3).save();
  try {
    await new ClientModel(MemoryStore.client).save();
  } catch {}
  const client = await ClientModel.findOne({ id: MemoryStore.client.id });
  MemoryStore.client._id = (client as unknown as any)._id;
  await Role.createDefaultRoles();
};

