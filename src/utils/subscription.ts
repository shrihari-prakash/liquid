import moment from "moment";
import UserModel, { UserInterface } from "../model/mongo/user";

export const checkSubscription = (input: UserInterface | UserInterface[]) => {
  if (Array.isArray(input)) {
    const toUpdate = [];
    const users = input;
    for (let i = 0; i < users.length; i++) {
      if (users[i].isSubscribed && moment().isAfter(moment(users[i].subscriptionExpiry))) {
        users[i].isSubscribed = false;
        toUpdate.push(users[i]._id);
      }
    }
    toUpdate.length && UserModel.updateMany({ _id: { $in: toUpdate } }, { $set: { isSubscribed: false } }, () => {});
    return users;
  } else {
    const user = input;
    if (user.isSubscribed && moment().isAfter(moment(user.subscriptionExpiry))) {
      user.isSubscribed = false;
      UserModel.updateOne({ _id: user._id }, { $set: { isSubscribed: false } }, () => {});
    }
    return user;
  }
};
