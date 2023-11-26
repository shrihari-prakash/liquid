import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "admin-api/editable-fields" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { Configuration } from "../../../../singleton/configuration";
import { ScopeManager } from "../../../../singleton/scope-manager";

const GET_SubscriptionTiers = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:configuration:read", res)) {
      return;
    }
    const subscriptionTiersFromConfiguration = Configuration.get("user.subscription.tier-list");
    const subscriptionTiers = [];
    const baseTier = Configuration.get("user.subscription.base-tier");
    for (let i = 0; i < subscriptionTiersFromConfiguration.length; i++) {
      const tier = subscriptionTiersFromConfiguration[i];
      subscriptionTiers.push({ name: tier, isBaseTier: baseTier === tier });
    }
    res.status(statusCodes.success).json(new SuccessResponse({ subscriptionTiers: subscriptionTiers }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_SubscriptionTiers;
