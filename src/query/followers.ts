import { mongo } from "mongoose";
import { UserProjection } from "../model/mongo/user";

export const useFollowersQuery: any = (userId: string, limit: number, requesterId: string) => {
  let query: any = [
    { $match: { $and: [{ targetId: new mongo.ObjectId(userId) }, { approved: true }] } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        let: { sourceId: "$sourceId" },
        as: "source",
        pipeline: [{ $match: { $expr: { $eq: ["$$sourceId", "$_id"] } } }, { $project: UserProjection }],
      },
    },
    { $unwind: "$source" },
  ];

  if (requesterId) {
    query = [
      ...query,
      {
        $lookup: {
          from: "blocks",
          let: { sourceId: "$sourceId", targetId: new mongo.ObjectId(requesterId) },
          as: "blocks",
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$sourceId", "$$sourceId"] }, { $eq: ["$targetId", "$$targetId"] }],
                },
              },
            },
          ],
        },
      },
      {
        $match: {
          blocks: { $size: 0 },
        },
      },
      { $unset: "blocks" },
    ];
  }
  query.push({ $project: { __v: 0, sourceId: 0, targetId: 0, approved: 0, updatedAt: 0 } });
  return query;
};
