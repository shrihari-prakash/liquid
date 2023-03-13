import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/block" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUser } from "../../../model/mongo/user";
import { hasErrors } from "../../../utils/api";
import { FollowStatus } from "../../../enum/follow-status";
import BlockModel from "../../../model/mongo/block";
import FollowModel from "../../../model/mongo/follow";
import { updateFollowCount } from "../../../utils/follow";

export const POST_BlockValidator = [body("target").exists().isString().isLength({ min: 8, max: 64 })];

function sendSuccess(res: Response, status: string) {
  res.status(statusCodes.success).json(new SuccessResponse({ status }));
}

const POST_Block = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const sourceAccount = res.locals.oauth.token.user._id;
    const blockedAccount = req.body.target;
    const query: any = {
      targetId: blockedAccount,
      sourceId: sourceAccount,
    };
    const target = (await UserModel.findOne({
      _id: blockedAccount,
    }).exec()) as unknown as IUser;
    if (target) {
      await new BlockModel(query).save();
      // Delete follow entry for the source person following the blocked account.
      const result1 = await FollowModel.deleteOne({
        sourceId: sourceAccount,
        targetId: blockedAccount,
        approved: true,
      });
      if (result1.deletedCount) {
        await updateFollowCount(sourceAccount, blockedAccount, -1);
      }
      // Delete follow entry for the blocked person following the source account.
      const result2 = await FollowModel.deleteOne({
        sourceId: blockedAccount,
        targetId: sourceAccount,
        approved: true,
      });
      if (result2.deletedCount) {
        await updateFollowCount(blockedAccount, sourceAccount, -1);
      }
    }
    sendSuccess(res, FollowStatus.BLOCKED);
  } catch (err: any) {
    if (err.message.includes("E11000")) {
      sendSuccess(res, FollowStatus.BLOCKED);
    }
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Block;
