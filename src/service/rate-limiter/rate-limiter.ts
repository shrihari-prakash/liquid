import rateLimit from "express-rate-limit";
import { errorMessages } from "../../utils/http-status";
import { ErrorResponse } from "../../utils/response";

const ONE_MINUTE = 1 * 60 * 1000;

const message = async () => {
  return new ErrorResponse(errorMessages.rateLimitError);
};

const standardOpts = { standardHeaders: true, legacyHeaders: false, message };

export const RateLimiter = {
  LIGHT: rateLimit({
    windowMs: ONE_MINUTE,
    max: 50,
    ...standardOpts,
  }),
  MEDIUM: rateLimit({
    windowMs: ONE_MINUTE,
    max: 25,
    ...standardOpts,
  }),
  HEAVY: rateLimit({
    windowMs: ONE_MINUTE,
    max: 10,
    ...standardOpts,
  }),
  EXTREME: rateLimit({
    windowMs: ONE_MINUTE,
    max: 3,
    ...standardOpts,
  }),
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
