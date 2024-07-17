import express from "express";
import { Passport } from "../../../../singleton/passport.js";
import GET_GoogleCallback from "./callback.get.js";
import POST_GoogleSuccess, { POST_GoogleSuccessValidator } from "./success.post.js";

const GoogleRouter = express.Router();

GoogleRouter.get(
  "/",
  Passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

GoogleRouter.get("/callback", Passport.authenticate("google"), GET_GoogleCallback);

GoogleRouter.post("/success", POST_GoogleSuccessValidator, POST_GoogleSuccess);

export default GoogleRouter;

