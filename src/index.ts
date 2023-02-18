import { Logger } from "./singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

import express from "express";
require("dotenv").config();
const path = require("path");
import session from "express-session";
import bodyParser from "body-parser";
import sgMail from "@sendgrid/mail";
const swaggerUi = require("swagger-ui-express");
var cors = require("cors");

import { Configuration } from "./singleton/configuration";
import { MongoDB } from "./singleton/mongo-db";
import { Api } from "./singleton/api/api";
import { activateRateLimiters } from "./service/rate-limiter/rate-limiter";
const YAML = require("yamljs");
const swaggerDocument = YAML.load(__dirname + "/swagger.yaml");

const app = express();
activateRateLimiters(app);
app.use(
  "/",
  express.static(path.join(__dirname, "public"), {
    index: false,
    extensions: ["html"],
  })
);
app.get("/", function (_, res) {
  res.sendFile(__dirname + "/public/login.html");
});
if (app.get("env") !== "production") {
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
  app.set("trust proxy", 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
  sgMail.setApiKey(Configuration.get("sendgrid-api-key") as string);
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

app.listen(Configuration.get("app-port"), () => {
  log.info(`${Configuration.get("app-name")} auth is listening at http://localhost:${Configuration.get("app-port")}`);
});

export default app;
