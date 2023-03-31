import Redis from "../service/redis/redis";
import RedisFake from "../service/redis/redis-fake";
import { Configuration } from "./configuration";

let redis: Redis;
if (Configuration.get("privilege.can-use-cache")) {
  redis = new Redis();
} else {
  redis = new RedisFake() as unknown as Redis;
}

export { redis as Redis };
