import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "redis" });

import IORedis from "ioredis";
import { Configuration } from "../../singleton/configuration.js";

class Redis {
  client;
  constructor(serviceName?: string) {
    if (!Configuration.get("privilege.can-use-cache")) {
      log.warn("Caching is disabled. Enable Redis caching for optimal performance.");
      return;
    }
    const host = Configuration.get("redis.host") as string;
    const port = Configuration.get("redis.port") as number;
    this.client = new IORedis.default({
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

  isSensitiveKey(key: string) {
    return key.includes("token:") || key.includes("code:");
  }

  async setEx(key: string, value: string, expires: number) {
    if (!this.client) {
      return null;
    }
    await this.client.set(key, value, "EX", expires);
    log.debug("Saved to cache: %s: *****", this.isSensitiveKey(key) ? "*****" : key);
    return;
  }

  async get(key: string) {
    if (!this.client) {
      return null;
    }
    const result = await this.client.get(key);
    log.debug("Get from cache: %s: *****", this.isSensitiveKey(key) ? "*****" : key);
    return result;
  }

  async del(key: string) {
    if (!this.client) {
      return null;
    }
    log.debug("Delete from cache: %s: *****", this.isSensitiveKey(key) ? "*****" : key);
    return await this.client.del(key);
  }
}

export default Redis;

