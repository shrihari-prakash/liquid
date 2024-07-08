import express from "express";
import { Passport } from "../../../../singleton/passport.js";
import GET_GoogleCallback from "./callback.get.js";
import GET_GoogleSuccess from "./success.get.js";

const GoogleRouter = express.Router();

GoogleRouter.get(
  "/",
  Passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

GoogleRouter.get("/callback", Passport.authenticate("google"), GET_GoogleCallback);

GoogleRouter.get("/success", GET_GoogleSuccess);

export default GoogleRouter;

