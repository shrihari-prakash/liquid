import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "sso/google/callback.get" });

import { Request, Response } from "express";

import { UserInterface } from "../../../../model/mongo/user.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse } from "../../../../utils/response.js";
import SSOTokenModel from "../../../../model/mongo/sso-token.js";
import { makeToken } from "../../../../utils/token.js";

const GET_GoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as UserInterface;
    if (!user || !user._id) {
      log.info("user not found");
      const params = new URLSearchParams({ message: "error.account-does-not-exist" });
      return res.redirect(`/not-found?${params.toString()}`);
    }
    const token = makeToken(128);
    const ssoToken = {
      userId: user._id,
      token,
    };
    const redirectUrl = `${Configuration.get("system.app-host")}/?ssoToken=${ssoToken.token}`;
    await new SSOTokenModel(ssoToken).save();
    res.redirect(redirectUrl);
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_GoogleCallback;

