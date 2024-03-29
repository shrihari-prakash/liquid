import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "rabbitmq" });

import { Configuration } from "../../singleton/configuration.js";

import amqp from "amqplib";

export default class RabbitMQ {
  channel: any;
  connection: any;
  channelName: string = Configuration.get("rabbitmq.channel-name");

  constructor() {
    this.connect();
  }

  async connect() {
    if (!Configuration.get("privilege.can-use-rabbitmq")) return log.info("Usage of RabbitMQ is disabled.");
    try {
      this.connection = await amqp.connect(Configuration.get("rabbitmq.connectionString"));
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.channelName);
      log.info("Connected to RabbitMQ.");
    } catch (error) {
      log.error(error);
    }
  }

  async publish(data: any) {
    if (!this.channel && !this.connection) return;
    await this.channel.sendToQueue(this.channelName, Buffer.from(JSON.stringify(data)));
  }
}
