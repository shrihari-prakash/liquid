import { expect } from "chai";
import sinon from "sinon";

import { Configuration } from "../../../src/singleton/configuration.js";
import { RabbitMQ } from "../../../src/singleton/rabbitmq.js";
import { RedisPublisher } from "../../../src/singleton/redis-publisher.js";
import { WebhookPublisher } from "../../../src/singleton/webhook-publisher.js";
import PusherClass, { PushEvent } from "../../../src/service/pusher/pusher.js";

describe("Pusher Service", () => {
  let sandbox: sinon.SinonSandbox;
  let configStub: sinon.SinonStub;
  let rabbitMQPublishStub: sinon.SinonStub;
  let redisPublishStub: sinon.SinonStub;
  let webhookPublishStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    configStub = sandbox.stub(Configuration, "get");
    
    rabbitMQPublishStub = sandbox.stub(RabbitMQ, "publish").resolves();
    redisPublishStub = sandbox.stub(RedisPublisher, "publish").resolves();
    webhookPublishStub = sandbox.stub(WebhookPublisher, "publish").resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should gracefully handle disabled push events system-wide", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(false);

    const pusher = new PusherClass();
    expect(pusher.queue).to.be.undefined;

    const event = new PushEvent("test.event", { id: 1 });
    await pusher.publish(event);

    expect(rabbitMQPublishStub.called).to.be.false;
    expect(redisPublishStub.called).to.be.false;
    expect(webhookPublishStub.called).to.be.false;
  });

  it("should initialize with RabbitMQ adapter", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("rabbitmq");
    configStub.withArgs("system.push-events").returns(["test.event"]);

    const pusher = new PusherClass();
    expect(pusher.queue).to.equal(RabbitMQ);

    const event = new PushEvent("test.event", { id: 1 });
    await pusher.publish(event);

    expect(rabbitMQPublishStub.calledOnce).to.be.true;
    expect(rabbitMQPublishStub.firstCall.args[0]).to.equal(event);
  });

  it("should initialize with Redis adapter", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("redis");
    configStub.withArgs("system.push-events").returns(["test.event"]);

    const pusher = new PusherClass();
    expect(pusher.queue).to.equal(RedisPublisher);

    const event = new PushEvent("test.event", { id: 1 });
    await pusher.publish(event);

    expect(redisPublishStub.calledOnce).to.be.true;
    expect(redisPublishStub.firstCall.args[0]).to.equal(event);
  });

  it("should initialize with Webhook adapter", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("webhook");
    configStub.withArgs("system.push-events").returns(["test.event"]);

    const pusher = new PusherClass();
    expect(pusher.queue).to.equal(WebhookPublisher);

    const event = new PushEvent("test.event", { id: 1 });
    await pusher.publish(event);

    expect(webhookPublishStub.calledOnce).to.be.true;
    expect(webhookPublishStub.firstCall.args[0]).to.equal(event);
  });

  it("should skip event publishing if event is not in allowed system.push-events", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("webhook");
    configStub.withArgs("system.push-events").returns(["allowed.event"]);

    const pusher = new PusherClass();
    
    const event = new PushEvent("not.allowed.event", { id: 1 });
    await pusher.publish(event);

    expect(webhookPublishStub.called).to.be.false;
  });

  it("should append prefix to event name if system.push-events.prefix is defined", async () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("webhook");
    configStub.withArgs("system.push-events").returns(["dev.test.event"]); 
    configStub.withArgs("system.push-events.prefix").returns("dev.");

    const pusher = new PusherClass();
    
    const event = new PushEvent("test.event", { id: 1 });
    await pusher.publish(event);

    expect(event.name).to.equal("dev.test.event");
    expect(webhookPublishStub.calledOnce).to.be.true;
    expect(webhookPublishStub.firstCall.args[0]).to.equal(event);
  });

  it("should log warning if adapter privileges are missing but still set the queue", () => {
    configStub.withArgs("privilege.can-use-push-events").returns(true);
    configStub.withArgs("system.queue-adapter").returns("rabbitmq");
    configStub.withArgs("privilege.can-use-rabbitmq").returns(false);
    configStub.withArgs("system.push-events").returns(["test.event"]);

    const pusher = new PusherClass();
    expect(pusher.queue).to.equal(RabbitMQ); 
  });
});
