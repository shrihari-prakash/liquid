import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "google-strategy" });

import { Strategy as googleStrategy, Profile } from "passport-google-oauth20";
import { generateFromEmail, generateUsername } from "unique-username-generator";

import { Configuration } from "../../../singleton/configuration.js";
import UserModel from "../../../model/mongo/user.js";

class GoogleStrategy {
  strategy: googleStrategy | null = null;
  constructor() {
    if (Configuration.get("user.account-creation.sso.google.enabled")) {
      this.strategy = new googleStrategy(
        {
          clientID: Configuration.get("user.account-creation.sso.google.client-id"),
          clientSecret: Configuration.get("user.account-creation.sso.google.client-secret"),
          callbackURL: `${Configuration.get("system.app-host")}/sso/google/callback`,
          scope: ["profile"],
        },
        this.onVerify.bind(this),
      );
    }
  }

  private onVerify = async (_: string, __: string, profile: Profile, cb: (err: Error | null, user: any) => void) => {
    log.info("Google profile received: %o", profile);
    if (!profile.emails || !profile.emails[0] || !profile.name || !profile.name.givenName || !profile.name.familyName) {
      return cb(new Error("No email found in Google profile."), undefined);
    }
    const existingUser = await UserModel.findOne({ googleProfileId: profile.id }).lean();
    let email = profile.emails[0].value;
    if (existingUser) {
      log.info("User found from Google profile.");
      UserModel.updateOne(
        { _id: existingUser._id },
        { ssoEnabled: true, ssoProvider: "google", googleProfileId: profile.id, email },
      ).exec();
      return cb(null, existingUser);
    }
    log.info("Creating user from Google profile.");
    const role = Configuration.get("system.role.default");
    const credits = Configuration.get("user.account-creation.initial-credit-count");
    let customData = Configuration.get("user.account-creation.custom-data.default-value");
    try {
      JSON.parse(customData);
    } catch {
      customData = "{}";
      log.warn("Invalid JSON found in `user.account-creation.custom-data.default-value`.");
    }
    let username = profile.username;
    if (!username) {
      username = generateFromEmail(email);
      log.debug("Generated username from email: %s", username);
    }
    const isDuplicateUsername = await UserModel.findOne({ username }).lean();
    log.debug("Duplicate username check: %o", isDuplicateUsername);
    if (isDuplicateUsername) {
      username = generateUsername("", 3);
      log.debug("Generated unique username: %s", username);
    }
    const newUser = new UserModel({
      email,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      username,
      emailVerified: true,
      ssoEnabled: true,
      ssoProvider: "google",
      googleProfileId: profile.id,
      scope: Configuration.get("user.account-creation.default-scope"),
      creationIp: "0.0.0.0",
      role,
      credits,
    });
    const savedUser = await newUser.save();
    return cb(null, savedUser);
  };
}

export default GoogleStrategy;

