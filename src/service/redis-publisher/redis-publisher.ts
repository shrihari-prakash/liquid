import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "rabbitmq" });

import { Configuration } from "../../singleton/configuration";
import Redis from "../redis/redis";
import RedisFake from "../redis/redis-fake";

export default class RedisPublisher {
  redis: Redis | undefined;
  channelName: string = Configuration.get("redis.channel-name");
  canUseCache: boolean | undefined;

  constructor() {
    this.connect();
  }

  async connect() {
    this.canUseCache = Configuration.get("privilege.can-use-cache");
    try {
      if (this.canUseCache && Configuration.get("environment") !== "test") {
        this.redis = new Redis("redis-publisher");
      } else {
        this.redis = new RedisFake() as unknown as Redis;
      }
    } catch (error) {
      log.error(error);
    }
  }

  async publish(data: any) {
    if (!this.redis || !this.canUseCache) return;
    await this.redis.client.publish(this.channelName, data);
  }
}
