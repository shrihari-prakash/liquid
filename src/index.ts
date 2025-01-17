import "dotenv/config";

import { Logger } from "./singleton/logger.js";
const log = Logger.getLogger().child({ from: "main" });

import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import cors from "cors";
import express from "express";
import { RedisStore } from "connect-redis";
import session from "express-session";
import bodyParser from "body-parser";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = fs.readFileSync(path.join(__dirname, "VERSION"), { encoding: "utf8" });
const banner = `
   __         __     ______     __  __     __     _____
  /\\ \\       /\\ \\   /\\  __ \\   /\\ \\/\\ \\   /\\ \\   /\\  __-.
  \\ \\ \\____  \\ \\ \\  \\ \\ \\/\\_\\  \\ \\ \\_\\ \\  \\ \\ \\  \\ \\ \\/\\ \\
   \\ \\_____\\  \\ \\_\\  \\ \\___\\_\\  \\ \\_____\\  \\ \\_\\  \\ \\____-
    \\/_____/   \\/_/   \\/___/_/   \\/_____/   \\/_/   \\/____/
  
  Version ${version}
  Copyright (c) 2022 - ${new Date().getFullYear()} Shrihari Prakasam

  View License: https://github.com/shrihari-prakash/liquid/blob/main/LICENSE
  Sponsor: https://github.com/sponsors/shrihari-prakash
`;
log.info(banner);

import { Configuration } from "./singleton/configuration.js";
const environment = Configuration.get("environment");
process.env.NODE_ENV = environment;
log.info("Environment: %s", environment);

if (
  Configuration.get("user.account-creation.sso.google.enabled") &&
  Configuration.get("user.account-creation.enable-invite-only")
) {
  Configuration.set("user.account-creation.enable-invite-only", false);
  log.warn("Invite only mode cannot be enabled when SSO is enabled. Disabling invite only mode.");
}

import { MongoDB } from "./singleton/mongo-db.js";
import { Api } from "./singleton/api.js";
import { activateRateLimiters } from "./service/rate-limiter/rate-limiter.js";
import { Mailer } from "./singleton/mailer.js";
import { Redis } from "./singleton/redis.js";
import { errorMessages, statusCodes } from "./utils/http-status.js";
import { ErrorResponse } from "./utils/response.js";
import { sanitizeEditableFields } from "./utils/user.js";
import { StaticRoutes } from "./enum/static-routes.js";
import { Passport } from "./singleton/passport.js";
import { CORS } from "./singleton/cors.js";
import { Bootstrap } from "./service/bootstrap/bootstrap.js";

const app = express();
app.disable("x-powered-by");

// ********** Rate Limiting ********** //
if (environment !== "test") {
  activateRateLimiters(app);
}
if (Configuration.get("system.stats.enable-request-counting")) {
  log.debug("Request counting enabled.");
  const key = Configuration.get("system.stats.request-count-key") as unknown as string;
  app.set(key, 0);
  app.use("*", (_, __, next) => {
    app.set(key, app.get(key) + 1);
    next();
  });
}
// ********** End Rate Limiting ********** //

// ********** iframe blocking ********** //
let iframeAction = Configuration.get("system.iframe.action");
app.use((_, res, next) => {
  if (iframeAction !== "ALLOW") {
    res.setHeader("X-Frame-Options", iframeAction);
  }
  next();
});

app.use(bodyParser.json({ limit: Configuration.get("system.request-body.json.max-size") }));
app.use(bodyParser.urlencoded({ extended: false }));

// ********** Sessions ********** //
var sessionOptions: any = {
  secret: Configuration.get("cookie.session-secret"),
  resave: false,
  saveUninitialized: false,
  proxy: environment === "production" && Configuration.get("system.reverse-proxy-mode"),
  cookie: {},
};
if (Configuration.get("privilege.can-use-cache")) {
  log.info("Using Redis store for express sessions.");
  let redisStore = new RedisStore({
    client: Redis.client,
    prefix: "session_id:",
  });
  sessionOptions.store = redisStore;
}
if (Configuration.get("cookie.secure")) {
  sessionOptions.cookie.secure = true;
}
const cookieDomain = Configuration.get("cookie.domain");
if (cookieDomain) {
  sessionOptions.cookie.domain = cookieDomain;
}
const cookieMaxAge = Configuration.get("cookie.max-age");
if (cookieMaxAge) {
  sessionOptions.cookie.maxAge = cookieMaxAge * 1000;
}
app.use(session(sessionOptions));
// ********** End Sessions ********** //

// ********** Passport Auth ********** //
Passport.initialize();
Passport.session();
// ********** End Passport Auth ********** //

// ********** CORS ********** //
CORS.initialize();
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (CORS.isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
// ********** End CORS ********** //

// ********** Response Compression ********** //
if (Configuration.get("system.enable-response-compression")) {
  log.info("Response compression is enabled.");
  app.use(compression());
}
// ********** End Response Compression ********** //

// ********** Singleton Init ********** //
if (environment !== "test") {
  MongoDB.connect();
}
Api.initialize(app);
Mailer.initialize(app);
// ********** End Singleton Init ********** //

// ********** UI / Static Pages ********** //
if (Configuration.get("system.use-built-in-static-ui")) {
  const staticFolder = path.join(__dirname, "public");
  // Static pages
  app.get(Object.values(StaticRoutes), function (_, res) {
    // index.html will route to the respective static pages.
    const index = path.join(staticFolder, "index.html");
    res.sendFile(index);
  });
  let appConfigPath = Configuration.get("system.static.app-config-file-path");
  if (!appConfigPath) {
    appConfigPath = path.join(staticFolder, "configuration/app-config.json");
    if (!fs.existsSync(appConfigPath)) {
      const source = path.join(staticFolder, "configuration/app-config.sample.json");
      const target = appConfigPath;
      fs.copyFileSync(source, target);
    }
    log.warn("Frontend config was not found. Please configure option `system.static.app-config-file-path`");
  }
  app.get("/app-config.json", function (_, res) {
    res.sendFile(appConfigPath);
  });
  // Static files. Stylesheets, images, etc.
  app.get(
    /^.*\.\w+$/,
    express.static(staticFolder, {
      index: false,
      extensions: ["html"],
    }),
  );
}
// ********** End UI / Static Pages ********** //

app.all("*", function (req, res) {
  const apiPattern = /^(\/user\/|\/system\/|\/oauth\/|\/sso\/|\/roles\/)/;
  if (!apiPattern.test(req.path) && Configuration.get("system.use-built-in-static-ui")) {
    const staticFolder = path.join(__dirname, "public");
    const index = path.join(staticFolder, "index.html");
    res.sendFile(index);
  } else {
    res
      .status(statusCodes.notFound)
      .json(new ErrorResponse(errorMessages.notFound, { method: req.method, path: req.path }));
  }
});

// ********** Reverse Proxy Setup ********** //
const isReverseProxy = Configuration.get("system.reverse-proxy-mode");
if (isReverseProxy) {
  app.set("trust proxy", true);
}
// ********** End Reverse Proxy Setup ********** //

if (Configuration.get("user.account-creation.allow-only-whitelisted-email-domains")) {
  log.info("Allowing only whitelisted domain names in user sign up.");
  log.info("Allowed domains: %s", Configuration.get("user.account-creation.whitelisted-email-domains"));
}

app.listen(Configuration.get("system.app-port"), () => {
  log.info(`${Configuration.get("system.app-name")} auth is listening at ${Configuration.get("system.app-host")}`);
});

sanitizeEditableFields();

const bootstrapService = new Bootstrap();
bootstrapService.configure();

export default app;

