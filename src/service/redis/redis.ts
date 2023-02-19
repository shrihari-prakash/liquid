import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "redis" });

import IORedis from "ioredis";
import { Configuration } from "../../singleton/configuration";

class Redis {
  client;
  constructor() {
    const host = Configuration.get("redis.host") as string;
    const port = Configuration.get("redis.port") as number;
    this.client = new IORedis({
      port: port,
      host: host,
      username: Configuration.get("redis.username") as string,
      password: Configuration.get("redis.password") as string,
      db: Configuration.get("redis.db") as number,
    });
    this.client.on("connect", function () {
      log.info("Connected to Redis (%s:%s).", host, port);
    });
  }
}

export default Redis;
