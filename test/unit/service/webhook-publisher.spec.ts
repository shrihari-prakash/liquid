import { expect } from "chai";
import sinon from "sinon";
import crypto from "crypto";

import { Configuration } from "../../../src/singleton/configuration.js";
import WebhookPublisherClass from "../../../src/service/webhook-publisher/webhook-publisher.js";

describe("WebhookPublisher Service", () => {
  let sandbox: sinon.SinonSandbox;
  let configStub: sinon.SinonStub;
  let fetchStub: sinon.SinonStub;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    configStub = sandbox.stub(Configuration, "get");
    fetchStub = sandbox.stub(global, "fetch").resolves({
      ok: true,
      status: 200,
      statusText: "OK",
    } as any);
    clock = sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should initialize successfully when configuration is valid", () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);

    const publisher = new WebhookPublisherClass();

    expect(publisher.url).to.equal("https://example.com/webhook");
    expect(publisher.secret).to.equal("my-secret");
    expect(publisher.canUseWebhookPusher).to.be.true;
  });

  it("should early exit publish if canUseWebhookPusher is false", async () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(false);

    const publisher = new WebhookPublisherClass();
    await publisher.publish({ test: "data" });

    expect(fetchStub.called).to.be.false;
  });

  it("should early exit publish if url or secret are missing", async () => {
    configStub.withArgs("pusher.webhook.url").returns(undefined);
    configStub.withArgs("pusher.webhook.secret").returns(undefined);
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);

    const publisher = new WebhookPublisherClass();
    await publisher.publish({ test: "data" });

    expect(fetchStub.called).to.be.false;
  });

  it("should publish successfully with one fetch call", async () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);
    configStub.withArgs("webhook.timeout").returns(5000);

    const publisher = new WebhookPublisherClass();
    const payload = { event: "user.created", data: { id: 1 } };

    const publishPromise = publisher.publish(payload);
    await clock.tickAsync(1);
    await publishPromise;

    expect(fetchStub.calledOnce).to.be.true;

    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal("https://example.com/webhook");
    expect(options.method).to.equal("POST");
    expect(options.headers["Content-Type"]).to.equal("application/json");

    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto.createHmac("sha256", "my-secret").update(payloadString).digest("hex");
    expect(options.headers["X-Webhook-Signature"]).to.equal(expectedSignature);
    expect(options.body).to.equal(payloadString);
    expect(options.signal).to.be.instanceOf(AbortSignal);
  });

  it("should retry on fetch failure up to maxRetries", async () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);
    configStub.withArgs("webhook.timeout").returns(5000);

    fetchStub.rejects(new Error("Network Error"));

    const publisher = new WebhookPublisherClass();
    const payload = { test: true };

    const publishPromise = publisher.publish(payload);

    await clock.tickAsync(1000);
    await clock.tickAsync(2000);
    await clock.tickAsync(4000);
    await clock.tickAsync(8000);

    await publishPromise;

    expect(fetchStub.callCount).to.equal(4);
  });

  it("should catch non-ok responses and retry", async () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);
    configStub.withArgs("webhook.timeout").returns(5000);

    fetchStub.resolves({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as any);

    const publisher = new WebhookPublisherClass();
    const payload = { test: true };

    const publishPromise = publisher.publish(payload);

    // Speed up time for all 4 attempts
    await clock.tickAsync(1000);
    await clock.tickAsync(2000);
    await clock.tickAsync(4000);
    await clock.tickAsync(8000);

    await publishPromise;

    expect(fetchStub.callCount).to.equal(4);
  });

  it("should succeed after initial retries", async () => {
    configStub.withArgs("pusher.webhook.url").returns("https://example.com/webhook");
    configStub.withArgs("pusher.webhook.secret").returns("my-secret");
    configStub.withArgs("privilege.can-use-webhook-pusher").returns(true);
    configStub.withArgs("webhook.timeout").returns(5000);

    fetchStub.onCall(0).rejects(new Error("Network Error"));
    fetchStub.onCall(1).rejects(new Error("Network Error"));
    fetchStub.onCall(2).resolves({ ok: true, status: 200 } as any);

    const publisher = new WebhookPublisherClass();
    const payload = { test: true };

    const publishPromise = publisher.publish(payload);

    await clock.tickAsync(1000);
    await clock.tickAsync(2000);
    await publishPromise;

    expect(fetchStub.callCount).to.equal(3);
  });
});
