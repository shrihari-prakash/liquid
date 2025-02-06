import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/block.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { hasErrors } from "../../../utils/api.js";
import { FollowStatus } from "../../../enum/follow-status.js";
import BlockModel from "../../../model/mongo/block.js";
import FollowModel from "../../../model/mongo/follow.js";
import { updateFollowCount } from "../../../utils/follow.js";
import { MongoDB } from "../../../singleton/mongo-db.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

export const POST_BlockValidator = [body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

function sendSuccess(res: Response, status: string) {
  res.status(statusCodes.success).json(new SuccessResponse({ status }));
}

const POST_Block = async (req: Request, res: Response): Promise<void> => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:block:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const sourceAccount = res.locals.oauth.token.user._id;
    const blockedAccount = req.body.target;
    if (sourceAccount === blockedAccount) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const query: any = {
      targetId: blockedAccount,
      sourceId: sourceAccount,
    };
    const target = (await UserModel.findOne({
      _id: blockedAccount,
    }).exec()) as unknown as UserInterface;
    if (target) {
      await new BlockModel(query).save(sessionOptions);
      // Delete follow entry for the source person following the blocked account.
      const intermQuery1 = FollowModel.deleteOne({
        sourceId: sourceAccount,
        targetId: blockedAccount,
        approved: true,
      });
      if (sessionOptions) intermQuery1.session(sessionOptions.session);
      const result1 = await intermQuery1;
      if (result1.deletedCount) {
        await updateFollowCount(sourceAccount, blockedAccount, -1, sessionOptions);
      }
      // Delete follow entry for the blocked person following the source account.
      const intermQuery2 = FollowModel.deleteOne({
        sourceId: blockedAccount,
        targetId: sourceAccount,
        approved: true,
      });
      if (sessionOptions) intermQuery2.session(sessionOptions.session);
      const result2 = await intermQuery2;
      if (result2.deletedCount) {
        await updateFollowCount(blockedAccount, sourceAccount, -1, sessionOptions);
      }
    }
    await MongoDB.commitTransaction(session);
    sendSuccess(res, FollowStatus.BLOCKED);
  } catch (err: any) {
    if (err?.message?.includes("E11000")) {
      return sendSuccess(res, FollowStatus.BLOCKED);
    }
    log.error(err);
    await MongoDB.abortTransaction(session);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Block;

