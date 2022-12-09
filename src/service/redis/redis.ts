import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "redis" });

import IORedis from "ioredis";
import { Configuration } from "../../singleton/configuration";

class Redis {
  client;
  constructor() {
    const host = Configuration.get("redisHost") as string;
    const port = Configuration.get("redisPort") as number;
    this.client = new IORedis({
      port: port,
      host: host,
      username: Configuration.get("redisUsername") as string,
      password: Configuration.get("redisPassword") as string,
      db: Configuration.get("redisDB") as number,
    });
    this.client.on("connect", function () {
      log.info("Connected to Redis (%s:%s)", host, port);
    });
  }
}

export default Redis;
