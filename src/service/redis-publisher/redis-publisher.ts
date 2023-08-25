import { Configuration } from "../../singleton/configuration";
import Redis from "../redis/redis";

export default class RedisPublisher {
  redis: Redis | undefined;
  channelName: string = Configuration.get("redis.channel-name");
  canUseCache: boolean | undefined;

  constructor() {
    this.connect();
  }

  async connect() {
    this.canUseCache = Configuration.get("privilege.can-use-cache");
    if (this.canUseCache && Configuration.get("environment") !== "test") {
      this.redis = new Redis("redis-publisher");
    }
  }

  async publish(data: any) {
    if (!this.redis?.client || !this.canUseCache) return;
    await this.redis.client.publish(this.channelName, data);
  }
}
