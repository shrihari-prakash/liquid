import express from "express";
import OAuthRouter from "./oauth/router";
import UserRouter from "./user/router";
import ClientRouter from "./client/router";
import SystemRouter from "./system/router";

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
