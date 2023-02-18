import rateLimit from "express-rate-limit";
import { Configuration } from "../../singleton/configuration";
import { errorMessages } from "../../utils/http-status";
import { ErrorResponse } from "../../utils/response";

const message = async () => {
  return new ErrorResponse(errorMessages.rateLimitError);
};
const windowSize = Configuration.get("system.rate-limit.window-size");
const standardOpts = { windowMs: windowSize * 1000, standardHeaders: true, legacyHeaders: false, message };

export const RateLimiter = {
  LIGHT: rateLimit({ max: Configuration.get("system.rate-limit.light-api-max-limit"), ...standardOpts }),
  MEDIUM: rateLimit({ max: Configuration.get("system.rate-limit.medium-api-max-limit"), ...standardOpts }),
  HEAVY: rateLimit({ max: Configuration.get("system.rate-limit.heavy-api-max-limit"), ...standardOpts }),
  EXTREME: rateLimit({ max: Configuration.get("system.rate-limit.extreme-api-max-limit"), ...standardOpts }),
};

export function activateRateLimiters(app: any) {
  app.use("/oauth", RateLimiter.MEDIUM);
  app.use("/user", RateLimiter.MEDIUM);

  app.post("/user/create", RateLimiter.EXTREME);
  app.post("/user/login", RateLimiter.HEAVY);
  app.get("/user/code", RateLimiter.EXTREME);

  app.use("/user/client-api", RateLimiter.LIGHT);
  app.use("/user/admin-api", RateLimiter.LIGHT);
}
