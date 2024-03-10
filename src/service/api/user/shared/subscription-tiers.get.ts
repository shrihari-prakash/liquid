import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/subscription-tiers.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";

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
