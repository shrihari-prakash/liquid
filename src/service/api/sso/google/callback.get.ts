import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "sso/google/callback.get" });

import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { UserInterface } from "../../../../model/mongo/user.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse } from "../../../../utils/response.js";
import SSOTokenModel from "../../../../model/mongo/sso-token.js";

const GET_GoogleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as UserInterface;
    const ssoToken = {
      userId: user._id,
      token: uuidv4(),
    };
    const redirectUrl = `${Configuration.get("system.app-host")}/?ssoToken=${ssoToken.token}`;
    await new SSOTokenModel(ssoToken).save();
    res.redirect(redirectUrl);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_GoogleCallback;

