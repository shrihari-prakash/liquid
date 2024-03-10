import { Logger } from "../singleton/logger.js";
const log = Logger.getLogger().child({ from: "follow-util" });

import UserModel from "../model/mongo/user.js";

export function updateFollowCount(sourceId: string, targetId: string, count: number, opts?: { session: any } | null) {
  return new Promise<void>((resolve, reject) => {
    const p1 = UserModel.updateOne({ _id: targetId }, { $inc: { followerCount: count } });
    if (opts) {
      p1.session(opts.session);
    }
    const p2 = UserModel.updateOne({ _id: sourceId }, { $inc: { followingCount: count } });
    if (opts) {
      p2.session(opts.session);
    }
    Promise.all([p1, p2])
      .then((results) => {
        log.debug("Follow count update results:");
        log.debug(results);
        resolve();
      })
      .catch(() => reject());
  });
}
