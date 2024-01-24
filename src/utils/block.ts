import { FollowStatus } from "../enum/follow-status";
import BlockModel from "../model/mongo/block";
import { Configuration } from "../singleton/configuration";
import { Redis } from "../singleton/redis";
import { errorMessages, statusCodes } from "./http-status";
import { ErrorResponse } from "./response";

const redisPrefix = "block:";
export const getBlockStatus = async (sourceId: string, targetId: string, res: any, skipCache = false) => {
  if (Configuration.get("privilege.can-use-cache") && !skipCache) {
    const cacheResults = await Redis.get(`${redisPrefix}${sourceId}_${targetId}`);
    if (cacheResults) {
      if (cacheResults === "blocked") {
        res &&
          res.status(statusCodes.forbidden).json(
            new ErrorResponse(errorMessages.blocked, {
              reason: FollowStatus.BLOCKED,
            })
          );
        return true;
      } else {
        return false;
      }
    }
  }
  const isBlocked: boolean = !!(await BlockModel.findOne({
    $and: [{ sourceId }, { targetId }],
  }).exec()) as unknown as boolean;
  if (isBlocked) {
    res &&
      res.status(statusCodes.forbidden).json(
        new ErrorResponse(errorMessages.blocked, {
          reason: FollowStatus.BLOCKED,
        })
      );
  }
  const cacheKey = `${redisPrefix}${sourceId}_${targetId}`;
  const cacheValue = isBlocked ? "blocked" : "unblocked";
  const cacheExpiry = Configuration.get("user.block-status.cache-lifetime");
  await Redis.setEx(cacheKey, cacheValue, cacheExpiry);
  return isBlocked;
};
