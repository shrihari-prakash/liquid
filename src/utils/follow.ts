import UserModel from "../model/mongo/user";

export function updateFollowCount(
  sourceId: string,
  targetId: string,
  count: number
) {
  return new Promise<void>((resolve, reject) => {
    const p1 = UserModel.updateOne(
      { _id: targetId },
      { $inc: { followerCount: count } }
    );
    const p2 = UserModel.updateOne(
      { _id: sourceId },
      { $inc: { followingCount: count } }
    );
    Promise.all([p1, p2])
      .then(() => resolve())
      .catch(() => reject());
  });
}
