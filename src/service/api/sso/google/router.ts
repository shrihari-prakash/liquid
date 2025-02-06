import express from "express";
import { Passport } from "../../../../singleton/passport.js";
import GET_GoogleSSO, { GET_GoogleSSOValidator } from "./sso.get.js";
import GET_GoogleCallback from "./callback.get.js";
import POST_GoogleSuccess, { POST_GoogleSuccessValidator } from "./success.post.js";

const GoogleRouter = express.Router();

GoogleRouter.get("/", GET_GoogleSSOValidator, GET_GoogleSSO);

GoogleRouter.get("/callback", Passport.authenticate("google"), GET_GoogleCallback);

GoogleRouter.post("/success", POST_GoogleSuccessValidator, POST_GoogleSuccess);

export default GoogleRouter;

