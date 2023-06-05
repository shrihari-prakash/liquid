import { Logger } from "./singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import * as fs from "fs";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import express from "express";
import RedisStore from "connect-redis";
import session from "express-session";
import bodyParser from "body-parser";

import { Configuration } from "./singleton/configuration";
import { MongoDB } from "./singleton/mongo-db";
import { Api } from "./singleton/api/api";
import { activateRateLimiters } from "./service/rate-limiter/rate-limiter";
import { Mailer } from "./singleton/mailer";
import { Redis } from "./singleton/redis";

import YAML from "yaml";

const app = express();

// Rate limiting
if (app.get("env") !== "test") {
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session stuff
var sessionOptions: any = {
  secret: Configuration.get("cookie-session-secret"),
  resave: false,
  saveUninitialized: false,
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
if (app.get("env") === "production") {
  app.set("trust proxy", true);
  sessionOptions.cookie.secure = true;
}
app.use(session(sessionOptions));

// CORS
app.use(
  cors({
    credentials: true,
    origin: Configuration.get("cors.allowed-origins"),
  })
);

//Singleton services.
if (app.get("env") !== "test") {
  MongoDB.connect();
}
Api.initialize(app);
Mailer.initialize(app);

// UI
const staticFolder = Configuration.get("system.static.use-relative-path")
  ? path.join(__dirname, Configuration.get("system.static-folder"))
  : Configuration.get("system.static-folder");
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
  const localAppConfigPath = path.join(__dirname, "app-config.json");
  if (!fs.existsSync(localAppConfigPath)) {
    const source = path.join(__dirname, "app-config.sample.json");
    const target = localAppConfigPath;
    fs.copyFileSync(source, target);
  }
  app.get("/app-config.json", function (_, res) {
    res.sendFile(localAppConfigPath);
  });
  log.warn("Frontend config was not found. Please configure option `system.static.app-config-absolute-path`");
}
if (Configuration.get("system.enable-swagger") || app.get("env") !== "production") {
  const swaggerDocument = YAML.parse(fs.readFileSync(__dirname + "/swagger.yaml", "utf8"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
app.all("*", function (_, res) {
  const root = path.join(__dirname, "/public/index.html");
  res.sendFile(root);
});

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
