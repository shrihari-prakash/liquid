import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "google-strategy" });

import { Strategy as googleStrategy, Profile } from "passport-google-oauth20";
import { generateFromEmail, generateUsername } from "unique-username-generator";
import * as express from "express";

import { Configuration } from "../../../singleton/configuration.js";
import UserModel from "../../../model/mongo/user.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import { GoogleLoginType } from "../../../enum/google-login-type.js";

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
          passReqToCallback: true,
        },
        this.onVerify.bind(this),
      );
    }
  }

  private onVerify = async (
    req: express.Request,
    _: string,
    __: string,
    profile: Profile,
    cb: (err: Error | null, user: any) => void,
  ) => {
    let type = GoogleLoginType.SIGNUP;
    let state = req.query.state;
    try {
      state = JSON.parse(state as string);
      if ((state as { type: string }).type === GoogleLoginType.LOGIN) type = GoogleLoginType.LOGIN;
    } catch {}
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
      Pusher.publish(new PushEvent(PushEventList.USER_LOGIN, { user: existingUser }));
      return cb(null, existingUser);
    }
    if (type === GoogleLoginType.LOGIN) return cb(null, {});
    if (!Configuration.get("privilege.can-create-account")) {
      log.warn("Account creation is disabled.");
      return cb(new Error("Account creation is disabled."), undefined);
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
    const isLengthOK = username.length >= 6 && username.length <= 32;
    const isDuplicateUsername = await UserModel.findOne({ username }).lean();
    log.debug("Duplicate username check: %o", isDuplicateUsername);
    if (!isLengthOK || isDuplicateUsername) {
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
    Pusher.publish(new PushEvent(PushEventList.USER_CREATE, { user: savedUser }));
    return cb(null, savedUser);
  };
}

export default GoogleStrategy;

