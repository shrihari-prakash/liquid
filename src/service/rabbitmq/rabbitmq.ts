import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "rabbitmq" });

import { Configuration } from "../../singleton/configuration";

const amqp = require("amqplib");

export default class RabbitMQ {
  channel: any;
  connection: any;
  channelName: string = Configuration.get("rabbitmq.channel-name");

  constructor() {
    this.connect();
  }

  async connect() {
    if (!Configuration.get("privilege.can-use-rabbitmq")) {
      log.info("Usage of RabbitMQ is disabled.");
      return;
    }
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
