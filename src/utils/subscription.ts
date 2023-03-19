import moment from "moment";
import { IUser } from "../model/mongo/user";

export const checkSubscription = (input: IUser | IUser[]) => {
  if (Array.isArray(input)) {
    const users = input;
    for (let i = 0; i < users.length; i++) {
      if (users[i].isSubscribed && moment().isAfter(moment(users[i].subscriptionExpiry))) {
        users[i].isSubscribed = false;
      }
    }
    return users;
  } else {
    const user = input;
    if (user.isSubscribed && moment().isAfter(moment(user.subscriptionExpiry))) {
      user.isSubscribed = false;
    }
    return user;
  }
};
