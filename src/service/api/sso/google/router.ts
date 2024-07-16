import express from "express";
import { Passport } from "../../../../singleton/passport.js";
import GET_GoogleCallback from "./callback.get.js";
import { POST_GoogleSuccessValidator }, POST_GoogleSuccess from "./success.get.js";

const GoogleRouter = express.Router();

GoogleRouter.get(
  "/",
  Passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

GoogleRouter.get("/callback", Passport.authenticate("google"), GET_GoogleCallback);

GoogleRouter.post("/success", GoogleSuccessValidator, POST_GoogleSuccess);

export default GoogleRouter;

