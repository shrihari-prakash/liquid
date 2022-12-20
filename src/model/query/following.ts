import { mongo } from "mongoose";

export const useFollowingQuery = (userId: string) => [
  {
    $match: {
      $and: [{ sourceId: new mongo.ObjectId(userId) }, { approved: true }],
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "targetId",
      foreignField: "_id",
      as: "target",
    },
  },
  { $unwind: "$target" },
  {
    $replaceRoot: {
      newRoot: "$target",
    },
  },
  {
    $project: {
      _id: 0,
      __v: 0,
      password: 0,
      isRestricted: 0,
      emailVerified: 0,
    },
  },
];
