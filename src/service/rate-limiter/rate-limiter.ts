import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import { Configuration } from "../../singleton/configuration";
import { errorMessages } from "../../utils/http-status";
import { ErrorResponse } from "../../utils/response";
import { Redis } from "../../singleton/redis";

const message = async () => {
  return new ErrorResponse(errorMessages.rateLimitError);
};
const windowSize = Configuration.get("system.rate-limit.window-size");
const standardOpts: any = { windowMs: windowSize * 1000, standardHeaders: true, legacyHeaders: false, message };

if (Configuration.get("privilege.can-use-cache")) {
  standardOpts.store = new RedisStore({
    prefix: "rate_limiter:",
    // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
    sendCommand: (...args: string[]) => Redis.client.call(...args),
  });
}

export const RateLimiter = {
  LIGHT: rateLimit({ max: Configuration.get("system.rate-limit.light-api-max-limit"), ...standardOpts }),
  MEDIUM: rateLimit({ max: Configuration.get("system.rate-limit.medium-api-max-limit"), ...standardOpts }),
  HEAVY: rateLimit({ max: Configuration.get("system.rate-limit.heavy-api-max-limit"), ...standardOpts }),
  EXTREME: rateLimit({ max: Configuration.get("system.rate-limit.extreme-api-max-limit"), ...standardOpts }),
};

export function activateRateLimiters(app: any) {
  app.use(/\/system\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);
  app.use(/\/oauth\/(?!introspect).*/, RateLimiter.MEDIUM);
  app.use(/\/user\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);
  app.use(/\/client\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);

  app.use("/system/admin-api", RateLimiter.LIGHT);
  app.use("/user/admin-api", RateLimiter.LIGHT);
  app.use("/client/admin-api", RateLimiter.LIGHT);

  app.post("/user/create", RateLimiter.EXTREME);
  app.post("/user/login", RateLimiter.HEAVY);
  app.get("/user/code", RateLimiter.EXTREME);
}
