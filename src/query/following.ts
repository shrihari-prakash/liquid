import { mongo } from "mongoose";
import { UserProjection } from "../model/mongo/user.js";

export const useFollowingQuery: any = (userId: string, limit: number, requesterId: string) => {
  let query: any = [
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
  ];
  if (requesterId) {
    query = [
      ...query,
      {
        $lookup: {
          from: "blocks",
          let: { targetId: "$targetId", userId: new mongo.ObjectId(requesterId) },
          as: "blocks",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$$targetId", "$sourceId"] }, { $eq: ["$$userId", "$targetId"] }],
                },
              },
            },
          ],
        },
      },
      { $match: { blocks: { $size: 0 } } },
      { $unset: "blocks" },
    ];
  }
  query.push({ $project: { __v: 0, sourceId: 0, targetId: 0, approved: 0, updatedAt: 0 } });
  return query;
};
