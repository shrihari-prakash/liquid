import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/followers" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { useFollowersQuery } from "../../../model/query/followers";
import { checkSubscription } from "../../../utils/subscription";
import { attachProfilePicture } from "../../../utils/profile-picture";
import { getPaginationLimit } from "../../../utils/pagination";

const GET_Followers = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query = useFollowersQuery(userId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    for (let i = 0; i < records.length; i++) {
      checkSubscription(records[i].source);
      await attachProfilePicture(records[i].source);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Followers;
