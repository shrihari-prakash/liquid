import moment from "moment";
import UserModel, { UserInterface } from "../model/mongo/user";
import { Configuration } from "../singleton/configuration";

export const checkSubscription = (input: UserInterface | UserInterface[]) => {
  const baseTier = Configuration.get("user.subscription.base-tier");
  if (Array.isArray(input)) {
    const toUpdate = [];
    const users = input;
    for (let i = 0; i < users.length; i++) {
      if (users[i].isSubscribed && moment().isAfter(moment(users[i].subscriptionExpiry))) {
        users[i].isSubscribed = false;
        users[i].subscriptionTier = baseTier;
        toUpdate.push(users[i]._id);
      }
    }
    toUpdate.length &&
      UserModel.updateMany(
        { _id: { $in: toUpdate } },
        { $set: { isSubscribed: false, subscriptionTier: baseTier } },
        () => {}
      );
    return users;
  } else {
    const user = input;
    if (user.isSubscribed && moment().isAfter(moment(user.subscriptionExpiry))) {
      user.isSubscribed = false;
      user.subscriptionTier = baseTier;
      UserModel.updateOne({ _id: user._id }, { $set: { isSubscribed: false, subscriptionTier: baseTier } }, () => {});
    }
    return user;
  }
};
