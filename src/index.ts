import { Logger } from "./singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import * as fs from "fs";
import cors from "cors";
import express from "express";
import RedisStore from "connect-redis";
import session from "express-session";
import bodyParser from "body-parser";
import compression from "compression";

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

import { Configuration } from "./singleton/configuration";
const environment = Configuration.get("environment");
process.env.NODE_ENV = environment;
log.info("Environment: %s", environment);

import { MongoDB } from "./singleton/mongo-db";
import { Api } from "./singleton/api/api";
import { activateRateLimiters } from "./service/rate-limiter/rate-limiter";
import { Mailer } from "./singleton/mailer";
import { Redis } from "./singleton/redis";

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

// ********** CORS ********** //
const systemCORS = Configuration.get("cors.allowed-origins") as string[];
log.debug("CORS origins %o", systemCORS);
app.use(
  cors({
    credentials: true,
    origin: systemCORS,
  })
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
const staticFolder = Configuration.get("system.static.use-relative-path")
  ? path.join(__dirname, Configuration.get("system.static-folder"))
  : Configuration.get("system.static-folder");
log.info("Static path normalized to %s", staticFolder);
app.use(
  "/",
  express.static(staticFolder, {
    index: false,
    extensions: ["html"],
  })
);
const appConfigAbsolutePath = Configuration.get("system.static.app-config-absolute-path");
if (appConfigAbsolutePath) {
  app.get("/app-config.json", function (_, res) {
    res.sendFile(appConfigAbsolutePath);
  });
} else {
  const localAppConfigPath = path.join(staticFolder, "configuration/app-config.json");
  if (!fs.existsSync(localAppConfigPath)) {
    const source = path.join(staticFolder, "configuration/app-config.sample.json");
    const target = localAppConfigPath;
    fs.copyFileSync(source, target);
  }
  app.get("/app-config.json", function (_, res) {
    res.sendFile(localAppConfigPath);
  });
  log.warn("Frontend config was not found. Please configure option `system.static.app-config-absolute-path`");
}
if (Configuration.get("system.static.fallback-to-index")) {
  app.all("*", function (_, res) {
    const index = path.join(staticFolder, "index.html");
    res.sendFile(index);
  });
}
// ********** End UI / Static Pages ********** //

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
  log.info(
    `${Configuration.get("system.app-name")} auth is listening at http://localhost:${Configuration.get(
      "system.app-port"
    )}`
  );
});

export default app;
