import { Logger } from "./singleton/logger";
const log = Logger.getLogger().child({ from: "main" });

import express from "express";
const path = require("path");
import session from "express-session";
import bodyParser from "body-parser";
import sgMail from "@sendgrid/mail";
const swaggerUi = require("swagger-ui-express");

import { Configuration } from "./singleton/configuration";
import { MongoDB } from "./singleton/mongo-db";
import { Api } from "./singleton/api/api";
const YAML = require("yamljs");
const swaggerDocument = YAML.load(__dirname + "/swagger.yaml");

const app = express();
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
  secret: Configuration.get("cookieSessionSecret"),
  resave: false,
  saveUninitialized: false,
  cookie: {},
};
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
  sgMail.setApiKey(Configuration.get("sendgridApiKey") as string);
}
app.use(session(sessionOptions));

MongoDB.connect();
Api.initialize(app);

app.listen(Configuration.get("appPort"), () => {
  log.info(`Auth service listening on port ${Configuration.get("appPort")}.`);
});

export default app;
