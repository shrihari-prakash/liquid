import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "rate-limiter" });

import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

import { Configuration } from "../../singleton/configuration.js";
import { errorMessages } from "../../utils/http-status.js";
import { ErrorResponse } from "../../utils/response.js";
import { Redis } from "../../singleton/redis.js";
import { Request } from "express";

const message = async () => {
  return new ErrorResponse(errorMessages.rateLimitError);
};
const windowSize = Configuration.get("system.rate-limit.window-size");
const standardOpts: any = { windowMs: windowSize * 1000, standardHeaders: true, legacyHeaders: false, message };

const keyGenerator = (req: Request) => {
  return `${req.ip}-${req.method}-${req.path}`;
};

if (Configuration.get("privilege.can-use-cache")) {
  standardOpts.store = new RedisStore({
    prefix: "rate_limiter:",
    // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
    sendCommand: (...args: string[]) => Redis.client.call(...args),
  });
}

if (Configuration.get("system.rate-limit.count-by-route")) {
  log.info(
    "API hits for rate limiting is counted per route for any given IP instead of a global counter. If you'd like to have a single counter per IP, disable the option `system.rate-limit.count-by-route`."
  );
  standardOpts.keyGenerator = keyGenerator;
}

export const RateLimiter = {
  LIGHT: rateLimit({ max: Configuration.get("system.rate-limit.light-api-max-limit"), ...standardOpts }),
  MEDIUM: rateLimit({ max: Configuration.get("system.rate-limit.medium-api-max-limit"), ...standardOpts }),
  HEAVY: rateLimit({ max: Configuration.get("system.rate-limit.heavy-api-max-limit"), ...standardOpts }),
  EXTREME: rateLimit({ max: Configuration.get("system.rate-limit.extreme-api-max-limit"), ...standardOpts }),
};

export function activateRateLimiters(app: any) {
  // Medium rate limit for all APIs in general.
  // No rate limits for client APIs.
  app.use(/\/system\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);
  app.use(/\/user\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);
  app.use(/\/client\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);
  app.use(/\/roles\/(?!client-api|admin-api).*/, RateLimiter.MEDIUM);

  // Medium rate limit for everything in OAuth except for introspecting tokens.
  app.use(/\/oauth\/(?!introspect).*/, RateLimiter.MEDIUM);

  // Lighter rate limit for admins.
  app.use("/system/admin-api", RateLimiter.LIGHT);
  app.use("/user/admin-api", RateLimiter.LIGHT);
  app.use("/client/admin-api", RateLimiter.LIGHT);
  app.use("/roles/admin-api", RateLimiter.LIGHT);

  // Potentially dangerous APIs for the system. Treated as extreme APIs.
  app.post("/user/create", RateLimiter.EXTREME);
  app.post("/user/login", RateLimiter.HEAVY);
  app.get("/user/code", RateLimiter.EXTREME);
  app.get("/user/do-2fa", RateLimiter.EXTREME);
}
