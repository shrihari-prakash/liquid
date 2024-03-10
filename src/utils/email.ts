import { Configuration } from "../singleton/configuration.js";

export const sanitizeEmailAddress = (email: string) => {
  email = email.toLowerCase();
  // Check this article on why we do this:
  // https://support.google.com/mail/answer/7436150
  if (email.endsWith("@gmail.com") && Configuration.get("user.account-creation.sanitize-gmail-addresses")) {
    const parts = email.split("@");
    parts[0] = parts[0].split("+")[0];
    return parts[0].replace(/\./g, "") + "@" + parts[1];
  }
  return email;
};
