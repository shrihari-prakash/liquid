import express from "express";
import OAuthRouter from "./oauth/router.js";
import UserRouter from "./user/router.js";
import ClientRouter from "./client/router.js";
import SystemRouter from "./system/router.js";

export class Api {
  public initialize(app: express.Application): void {
    app.use("/oauth", OAuthRouter);
    app.use("/user", UserRouter);
    app.use("/client", ClientRouter);
    app.use("/system", SystemRouter);
    app.get("/health", function (_, res) {
      res.send({ status: "UP" });
    });
  }
}
