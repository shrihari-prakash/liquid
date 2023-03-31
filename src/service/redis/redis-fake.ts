import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "redis-fake" });

export default class RedisFake {
  constructor() {
    log.info("Redis initialization faked since option `Can Use Cache(privilege.can-use-cache)` is false.");
  }
}
