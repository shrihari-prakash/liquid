import moment from "moment";
import UserModel, { UserInterface } from "../model/mongo/user.js";
import { Configuration } from "../singleton/configuration.js";

const baseTier = Configuration.get("user.subscription.base-tier");

const isSubscribed = (user: UserInterface) => {
  if (!user.subscriptionTier || user.subscriptionTier === baseTier) {
    return false;
  }
  if (!user.isSubscribed) {
    return false;
  }
  if (user.isSubscribed && moment().isAfter(moment(user.subscriptionExpiry))) {
    return false;
  }
  return true;
};

export const checkSubscription = (user: UserInterface) => {
  const wasSubscribed = user.isSubscribed;
  if (!isSubscribed(user)) {
    user.isSubscribed = false;
    user.subscriptionTier = baseTier;
    if (wasSubscribed) {
      UserModel.updateOne({ _id: user._id }, { $set: { isSubscribed: false, subscriptionTier: baseTier } });
    }
  }
  return user;
};
