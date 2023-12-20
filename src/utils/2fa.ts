import { UserInterface } from "../model/mongo/user";
import { Configuration } from "../singleton/configuration";

export const isEmail2FA = (user: UserInterface) => {
  if (Configuration.get("2fa.email.enforce")) {
    return true;
  }
  // Opt in
  if (user["2faEnabled"] && user["2faMedium"] === "email") {
    return true;
  }
};
