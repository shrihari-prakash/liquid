import session from "express-session";

export = session;

declare module "express-session" {
  export interface SessionData {
    oAuthLogin: boolean;
    user: { [key: string]: any };
  }
}
