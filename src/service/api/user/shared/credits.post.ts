import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/credits.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";
import CreditTransactionModel from "../../../../model/mongo/credit-transaction.js";
import { MongoDB } from "../../../../singleton/mongo-db.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/cache.js";

const Operations = {
  INCREMENT: "increment",
  DECREMENT: "decrement",
  SET: "set",
};

export const POST_CreditsValidator = [
  body("target").exists().isString().isLength({ max: 128 }).custom(isValidObjectId),
  body("type").exists().isString().isIn([Operations.INCREMENT, Operations.DECREMENT, Operations.SET]),
  body("value").exists().isInt({ min: 0 }),
];

const POST_Credits = async (req: Request, res: Response): Promise<void> => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:credits:write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    let conditions: any = { _id: target };
    const query: any = {};
    let value;
    switch (req.body.type) {
      case Operations.INCREMENT:
        value = req.body.value;
        query.$inc = { credits: value };
        break;
      case Operations.DECREMENT:
        value = req.body.value;
        query.$inc = { credits: -value };
        conditions = {
          $and: [
            { _id: target },
            {
              credits: {
                $gte: value,
              },
            },
          ],
        };
        break;
      case Operations.SET:
        value = req.body.value;
        query.$set = { credits: value };
    }
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const updateQuery = UserModel.updateOne(conditions, query);
    if (sessionOptions) updateQuery.session(sessionOptions.session);
    const updateResult = await updateQuery;
    if (!updateResult.modifiedCount) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.insufficientCredits));
      await MongoDB.abortTransaction(session);
      return;
    }
    if (Configuration.get("privilege.can-use-credit-transaction-history")) {
      const sourceType = res.locals.user.isClient ? "client" : "user";
      const creditTransaction = {
        sourceType,
        sourceId: res.locals.oauth.token.user._id,
        targetId: target,
        type: req.body.type,
        value: req.body.value,
      };
      await new CreditTransactionModel(creditTransaction).save(sessionOptions);
    }
    await MongoDB.commitTransaction(session);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Credits;
