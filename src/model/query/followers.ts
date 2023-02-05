import { mongo } from "mongoose";
import { IUserProjection } from "../mongo/user";

export const useFollowersQuery: any = (userId: string, limit: number) => [
  { $match: { $and: [{ targetId: new mongo.ObjectId(userId) }, { approved: true }] } },
  { $sort: { createdAt: -1 } },
  { $limit: limit },
  {
    $lookup: {
      from: "users",
      let: { sourceId: "$sourceId" },
      as: "target",
      pipeline: [{ $match: { $expr: { $eq: ["$$sourceId", "$_id"] } } }, { $project: IUserProjection }],
    },
  },
  { $unwind: "$target" },
  { $project: { __v: 0, sourceId: 0, targetId: 0, approved: 0, updatedAt: 0 } },
];
