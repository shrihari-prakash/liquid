import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "passport" });

import passport from "passport";
import { Configuration } from "../../singleton/configuration.js";
import GoogleStrategy from "./strategies/google.js";

export class Passport {
  constructor() {
    const googleStrategy = new GoogleStrategy();
    if (Configuration.get("user.account-creation.sso.google.enabled") && googleStrategy.strategy) {
      passport.use(googleStrategy.strategy);
    }
    passport.serializeUser(function (user, done) {
      done(null, user);
    });
    passport.deserializeUser(function (user, done) {
      done(null, user as any);
    });
    log.info("Passport created.");
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

