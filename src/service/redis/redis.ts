import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "redis" });

import IORedis from "ioredis";
import { Configuration } from "../../singleton/configuration";

class Redis {
  client;
  constructor(serviceName?: string) {
    const host = Configuration.get("redis.host") as string;
    const port = Configuration.get("redis.port") as number;
    this.client = new IORedis({
      port: port,
      host: host,
      username: Configuration.get("redis.username") as string,
      password: Configuration.get("redis.password") as string,
      db: Configuration.get("redis.db") as number,
      keyPrefix: Configuration.get("redis.key-prefix") as string,
    });
    this.client.on("connect", function () {
      log.info("[%s] Connected to Redis (%s:%s).", serviceName || "default", host, port);
    });
    this.client.on("error", function (error) {
      log.error("Error connecting to Redis (%o).", error);
    });
  }
}

export default Redis;
