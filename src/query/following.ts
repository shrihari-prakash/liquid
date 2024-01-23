import { mongo } from "mongoose";
import { UserProjection } from "../model/mongo/user";

export const useFollowingQuery: any = (userId: string, limit: number) => [
  { $match: { $and: [{ sourceId: new mongo.ObjectId(userId) }, { approved: true }] } },
  { $sort: { createdAt: -1 } },
  { $limit: limit },
  {
    $lookup: {
      from: "users",
      let: { targetId: "$targetId" },
      as: "target",
      pipeline: [{ $match: { $expr: { $eq: ["$$targetId", "$_id"] } } }, { $project: UserProjection }],
    },
  },
  { $unwind: "$target" },
  { $project: { __v: 0, sourceId: 0, targetId: 0, approved: 0, updatedAt: 0 } },
];
