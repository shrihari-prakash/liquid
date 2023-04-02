import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "events" });

import { Configuration } from "../../singleton/configuration";
import { RabbitMQ } from "../../singleton/rabbitmq";

export class PushEvent {
  name: string;
  data: any;
  constructor(name: string, data?: any) {
    this.name = name;
    this.data = data;
  }
}

export default class Pusher {
  queue: typeof RabbitMQ | undefined;

  constructor() {
    if (!Configuration.get("privilege.can-use-push-events")) {
      log.info("Usage of Events is disabled.");
      return;
    }
    switch (Configuration.get("system.queue-adapter")) {
      case "rabbitmq":
        if (!Configuration.get("privilege.can-use-rabbitmq")) {
          log.warn(
            "Usage of push events is enabled. However, this requires option `Can Use RabbitMQ(privilege.can-use-rabbitmq)` to be true. Events will not be published until you setup RabbitMQ options."
          );
        }
        this.queue = RabbitMQ;
        break;
    }
  }

  async publish(event: PushEvent) {
    if (!this.queue) return;
    if (!Configuration.get("system.push-events").includes(event.name)) {
      return log.debug("Event `%s` now skipped.", event.name);
    }
    switch (Configuration.get("system.queue-adapter")) {
      case "rabbitmq":
        await RabbitMQ.publish(event);
        log.debug("Published event. %o", event);
        break;
    }
  }
}
