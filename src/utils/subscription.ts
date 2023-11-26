import moment from "moment";
import UserModel, { UserInterface } from "../model/mongo/user";
import { Configuration } from "../singleton/configuration";

const baseTier = Configuration.get("user.subscription.base-tier");

const isSubscribed = (user: UserInterface) => {
  if (user.subscriptionTier === baseTier) {
    return false;
  }
  if (user.isSubscribed && moment().isAfter(moment(user.subscriptionExpiry))) {
    return false;
  }
  return true;
};

export const checkSubscription = (input: UserInterface | UserInterface[]) => {
  if (Array.isArray(input)) {
    const toUpdate = [];
    const users = input;
    for (let i = 0; i < users.length; i++) {
      const wasSubscribed = users[i].isSubscribed;
      if (!isSubscribed(users[i])) {
        users[i].isSubscribed = false;
        users[i].subscriptionTier = baseTier;
        if (wasSubscribed) {
          toUpdate.push(users[i]._id);
        }
      }
    }
    toUpdate.length &&
      UserModel.updateMany({ _id: { $in: toUpdate } }, { $set: { isSubscribed: false, subscriptionTier: baseTier } });
    return users;
  } else {
    const user = input;
    const wasSubscribed = user.isSubscribed;
    if (!isSubscribed(user)) {
      user.isSubscribed = false;
      user.subscriptionTier = baseTier;
      if (wasSubscribed) {
        UserModel.updateOne({ _id: user._id }, { $set: { isSubscribed: false, subscriptionTier: baseTier } });
      }
    }
    return user;
  }
};
