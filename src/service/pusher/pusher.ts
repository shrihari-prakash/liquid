import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "events" });

import { v4 as uuidv4 } from "uuid";

import { Configuration } from "../../singleton/configuration.js";
import { RabbitMQ } from "../../singleton/rabbitmq.js";
import { RedisPublisher } from "../../singleton/redis-publisher.js";

export class PushEvent {
  id = uuidv4();
  name: string;
  data: any;
  constructor(name: string, data?: any) {
    this.name = name;
    this.data = data;
  }
}

const adapters = {
  RabbitMQ: "rabbitmq",
  Redis: "redis",
};

export default class Pusher {
  queue: typeof RabbitMQ | typeof RedisPublisher | undefined;

  constructor() {
    if (!Configuration.get("privilege.can-use-push-events")) {
      return log.info("Usage of Events is disabled.");
    } else {
      log.info(
        "Push running on %s adapter for events %s.",
        Configuration.get("system.queue-adapter"),
        Configuration.get("system.push-events"),
      );
    }
    switch (Configuration.get("system.queue-adapter")) {
      case adapters.RabbitMQ:
        if (!Configuration.get("privilege.can-use-rabbitmq")) {
          log.warn(
            "Usage of push events is enabled. However, this requires option `Can Use RabbitMQ(privilege.can-use-rabbitmq)` to be true. Events will not be published until you setup RabbitMQ options.",
          );
        }
        this.queue = RabbitMQ;
        break;
      case adapters.Redis:
        if (!Configuration.get("privilege.can-use-cache")) {
          log.warn(
            "Usage of push events is enabled. However, this requires option `Can Use Redis(privilege.can-use-cache)` to be true. Events will not be published until you setup Redis options.",
          );
        }
        this.queue = RedisPublisher;
        break;
    }
  }

  async publish(event: PushEvent) {
    const prefix = Configuration.get("system.push-events.prefix");
    if (prefix) event.name = `${prefix}.${event.name}`;
    log.debug("Pusher publish called: %o", event);
    if (!this.queue) return;
    if (!Configuration.get("system.push-events").includes(event.name)) {
      return log.debug("Event `%s` now skipped.", event.name);
    }
    switch (Configuration.get("system.queue-adapter")) {
      case adapters.RabbitMQ:
        await RabbitMQ.publish(event);
        log.debug("Published event to RabbitMQ. %o", event);
        break;
      case adapters.Redis:
        await RedisPublisher.publish(event);
        log.debug("Published event to Redis PubSub. %o", event);
        break;
    }
  }
}

