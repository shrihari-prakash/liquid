import { Logger } from "./singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";

import { Configuration } from "./singleton/configuration";
import { MongoDB } from "./singleton/mongo-db";
import { Api } from "./singleton/api/api";
import { activateRateLimiters } from "./service/rate-limiter/rate-limiter";
import { Mailer } from "./singleton/mailer";

const YAML = require("yamljs");
const swaggerDocument = YAML.load(__dirname + "/swagger.yaml");

const app = express();
if (app.get("env") !== "test") {
  activateRateLimiters(app);
}
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
log.info("Static folder loaded: %s", staticFolder);
if (Configuration.get("system.stats.enable-request-counting")) {
  log.debug("Request counting enabled.");
  const key = Configuration.get("system.stats.request-count-key") as unknown as string;
  app.set(key, 0);
  app.use("*", (_, __, next) => {
    app.set(key, app.get(key) + 1);
    next();
  });
}
app.get("/", function (_, res) {
  const defaultPage = Configuration.get("system.static.use-relative-path")
    ? path.join(__dirname, Configuration.get("system.static.default-page"))
    : Configuration.get("system.static.default-page");
  res.sendFile(defaultPage);
});
const appConfigAbsolutePath = Configuration.get("system.static.app-config-absolute-path");
if (appConfigAbsolutePath) {
  app.get("/app-config.json", function (_, res) {
    res.sendFile(appConfigAbsolutePath);
  });
} else if (!fs.existsSync(path.join(__dirname, "/public/app-config.json"))) {
  const source = path.join(__dirname, "/public/app-config.sample.json");
  const target = path.join(__dirname, "/public/app-config.json");
  fs.copyFileSync(source, target);
  log.warn(
    "Frontend config was auto generated. You will still need to manually configure OAuth based options in `public/app-config.json`"
  );
}
if (Configuration.get("system.enable-swagger") || app.get("env") !== "production") {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var sessionOptions: any = {
  secret: Configuration.get("cookie-session-secret"),
  resave: false,
  saveUninitialized: false,
  cookie: {},
};
if (app.get("env") === "production") {
  app.set("trust proxy", true);
  sessionOptions.cookie.secure = true;
}
app.use(session(sessionOptions));
app.use(
  cors({
    credentials: true,
    origin: Configuration.get("cors.allowed-origins"),
  })
);

MongoDB.connect();

Api.initialize(app);

Mailer.initialize(app);

app.listen(Configuration.get("system.app-port"), () => {
  log.info(
    `${Configuration.get("system.app-name")} auth is listening at http://localhost:${Configuration.get(
      "system.app-port"
    )}`
  );
});

export default app;
