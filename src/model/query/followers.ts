import { mongo } from "mongoose";

export const useFollowersQuery = (userId: string) => [
  {
    $match: {
      $and: [{ targetId: new mongo.ObjectId(userId) }, { approved: true }],
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "sourceId",
      foreignField: "_id",
      as: "source",
    },
  },
  { $unwind: "$source" },
  {
    $replaceRoot: {
      newRoot: "$source",
    },
  },
  {
    $project: {
      __v: 0,
      password: 0,
      isRestricted: 0,
      emailVerified: 0,
    },
  },
];
