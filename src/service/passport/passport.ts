import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "passport" });

import passport from "passport";
import { Configuration } from "../../singleton/configuration.js";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import UserModel from "../../model/mongo/user.js";

export class Passport {
  constructor() {
    if (Configuration.get("user.account-creation.sso.google.enabled")) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: Configuration.get("user.account-creation.sso.google.client-id"),
            clientSecret: Configuration.get("user.account-creation.sso.google.client-secret"),
            callbackURL: `${Configuration.get("system.app-host")}/sso/google/callback`,
            scope: ["profile"],
          },
          this.onVerify.bind(this),
        ),
      );
      passport.serializeUser(function (user, done) {
        done(null, user);
      });

      passport.deserializeUser(function (user, done) {
        done(null, user as any);
      });
      log.info("Passport created.");
    }
  }

  private async onVerify(_: string, __: string, profile: Profile, cb: (err: Error | null, user: any) => void) {
    log.info("Google profile received: %o", profile);
    if (!profile.emails || !profile.emails[0] || !profile.name || !profile.name.givenName || !profile.name.familyName) {
      return cb(new Error("No email found in Google profile."), undefined);
    }
    const existingUser = await UserModel.findOne({ email: profile.emails[0].value }).lean();
    if (existingUser) {
      log.info("User found from Google profile.");
      UserModel.updateOne(
        { _id: existingUser._id },
        { ssoEnabled: true, ssoProvider: "google", googleProfileId: profile.id },
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
    const newUser = new UserModel({
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      username: profile.emails[0].value,
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
  }

  public initialize() {
    passport.initialize();
    log.debug("Passport initialized.");
  }

  public session() {
    passport.session();
    log.debug("Passport session initialized.");
  }

  public authenticate = passport.authenticate.bind(passport);
}

