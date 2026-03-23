import { expect } from 'chai';
import sinon from 'sinon';
import { Mailer } from '../../../src/service/mailer/mailer.js';
import { Configuration } from '../../../src/singleton/configuration.js';
import * as crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Pusher } from '../../../src/singleton/pusher.js';
import { SESClient } from '@aws-sdk/client-ses';
import { PushEventList } from '../../../src/enum/push-events.js';

describe('Mailer Service', () => {
  let sandbox: sinon.SinonSandbox;
  let mailerService: Mailer;
  let configStub: sinon.SinonStub;
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mailerService = new Mailer();
    configStub = sandbox.stub(Configuration, 'get');
    
    // Stub global fetch
    fetchStub = sandbox.stub(global, 'fetch').resolves({
      ok: true,
      status: 200,
      statusText: 'OK'
    } as any);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Webhook Adapter', () => {
    it('should initialize webhook adapter properly', () => {
      configStub.withArgs('webhook.url').returns('http://example.com/webhook');
      configStub.withArgs('webhook.secret').returns('my-secret');
      
      mailerService.adapter = 'webhook';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('webhook');
    });

    it('should log warning if url or secret are missing during initialization', () => {
      configStub.withArgs('webhook.url').returns(undefined);
      configStub.withArgs('webhook.secret').returns(undefined);

      mailerService.adapter = 'webhook';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('webhook');
      // Initialization doesn't throw, it just logs warnings
    });

    it('should send email payload via webhook with valid signature header', async () => {
      configStub.withArgs('webhook.url').returns('http://example.com/webhook');
      configStub.withArgs('webhook.secret').returns('my-secret');
      configStub.withArgs('webhook.timeout').returns(5000);
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.mode = 'webhook'; // Simulating initialized state

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Test Email',
        text: 'Hello World',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);

      expect(fetchStub.calledOnce).to.be.true;
      
      const fetchArgs = fetchStub.firstCall.args;
      expect(fetchArgs[0]).to.equal('http://example.com/webhook');
      
      const options = fetchArgs[1];
      expect(options.method).to.equal('POST');
      expect(options.headers['Content-Type']).to.equal('application/json');
      
      // email gets populated with "from" if it doesn't exist
      const expectedPayload = JSON.stringify({
        to: 'user@example.com',
        subject: 'Test Email',
        text: 'Hello World',
        dynamicTemplateData: {},
        from: { email: 'test@liquid.com', name: 'Liquid' }
      });
      
      const expectedSignature = crypto.createHmac('sha256', 'my-secret').update(expectedPayload).digest('hex');
      expect(options.headers['X-Webhook-Signature']).to.equal(expectedSignature);
      expect(options.body).to.equal(expectedPayload);
    });

    it('should short-circuit and not fetch if webhook config is incomplete', async () => {
      configStub.withArgs('webhook.url').returns(undefined);
      configStub.withArgs('webhook.secret').returns('my-secret');
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.mode = 'webhook';

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Test Email',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);
      
      // Fetch should not be called due to early return
      expect(fetchStub.called).to.be.false;
    });

    it('should throw error when fetch rejects (e.g., network error)', async () => {
      configStub.withArgs('webhook.url').returns('http://example.com/webhook');
      configStub.withArgs('webhook.secret').returns('my-secret');
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      fetchStub.rejects(new Error('Network connection failed'));
      mailerService.mode = 'webhook';

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Fail Test',
        dynamicTemplateData: {}
      };

      try {
        await mailerService.send(emailPayload);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Network connection failed');
      }
    });
  });

  describe('Print Adapter (Default)', () => {
    it('should initialize print adapter properly by default', () => {
      mailerService.adapter = 'print';
      mailerService.initialize({});
      expect(mailerService.mode).to.equal('print');
    });

    it('should log email details securely without throwing', async () => {
      mailerService.mode = 'print';

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Print Mode Test',
        dynamicTemplateData: {}
      };

      // Doesn't throw any errors
      await mailerService.send(emailPayload);
      
      // Verification is primarily that it successfully exits since we don't spy on module-scoped loggers easily
      expect(mailerService.mode).to.equal('print');
    });
  });

  describe('Sendgrid Adapter', () => {
    let sgMailSetApiKeyStub: sinon.SinonStub;
    let sgMailSendStub: sinon.SinonStub;

    beforeEach(() => {
      sgMailSetApiKeyStub = sandbox.stub(sgMail, 'setApiKey');
      sgMailSendStub = sandbox.stub(sgMail, 'send').resolves();
    });

    it('should initialize Sendgrid adapter and set API key', () => {
      configStub.withArgs('sendgrid.api-key').returns('SG.test-key');
      
      mailerService.adapter = 'sendgrid';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('sendgrid');
      expect(sgMailSetApiKeyStub.calledOnceWith('SG.test-key')).to.be.true;
    });

    it('should send email payload via Sendgrid correctly', async () => {
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.mode = 'sendgrid';

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Sendgrid Test',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);

      expect(sgMailSendStub.calledOnce).to.be.true;
      
      const sentPayload = sgMailSendStub.firstCall.args[0];
      expect(sentPayload.to).to.equal('user@example.com');
      expect(sentPayload.from.email).to.equal('test@liquid.com');
      expect(sentPayload.from.name).to.equal('Liquid');
      expect(sentPayload.subject).to.equal('Sendgrid Test');
    });
  });

  describe('Nodemailer Adapter', () => {
    let createTransportStub: sinon.SinonStub;
    let verifyStub: sinon.SinonStub;
    let sendMailStub: sinon.SinonStub;

    beforeEach(() => {
      verifyStub = sandbox.stub().callsArgWith(0, null); // Yields success
      sendMailStub = sandbox.stub().resolves();
      createTransportStub = sandbox.stub(nodemailer, 'createTransport').returns({
        verify: verifyStub,
        sendMail: sendMailStub,
      } as any);
    });

    it('should initialize Nodemailer securely and verify transport', () => {
      configStub.withArgs('nodemailer.service-name').returns('gmail');
      configStub.withArgs('nodemailer.host').returns('smtp.gmail.com');
      configStub.withArgs('nodemailer.port').returns(587);
      configStub.withArgs('nodemailer.secure').returns(true);
      configStub.withArgs('nodemailer.username').returns('user@gmail.com');
      configStub.withArgs('nodemailer.password').returns('password');

      mailerService.adapter = 'nodemailer';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('nodemailer');
      expect(createTransportStub.calledOnce).to.be.true;
      expect(verifyStub.calledOnce).to.be.true;
      
      const configArg = createTransportStub.firstCall.args[0];
      expect(configArg.host).to.equal('smtp.gmail.com');
      expect(configArg.auth.user).to.equal('user@gmail.com');
    });

    it('should send email payload via Nodemailer correctly', async () => {
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.mode = 'nodemailer';
      mailerService.transporter = { sendMail: sendMailStub } as any;

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Nodemailer Test',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);

      expect(sendMailStub.calledOnce).to.be.true;
      
      const sentPayload = sendMailStub.firstCall.args[0];
      expect(sentPayload.to).to.equal('user@example.com');
      expect(sentPayload.from).to.equal('Liquid <test@liquid.com>'); // Formats properly
      expect(sentPayload.subject).to.equal('Nodemailer Test');
    });
  });

  describe('AWS SES Adapter', () => {
    it('should initialize SES adapter with credentials', () => {
      configStub.withArgs('aws.ses.region').returns('us-east-1');
      configStub.withArgs('aws.ses.access-key-id').returns('AWS_KEY');
      configStub.withArgs('aws.ses.access-key-secret').returns('AWS_SECRET');

      mailerService.adapter = 'ses';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('ses');
      expect(mailerService.sesClient).to.be.instanceOf(SESClient);
    });

    it('should send email payload via SES correctly', async () => {
      configStub.withArgs('aws.ses.region').returns('us-east-1');
      configStub.withArgs('aws.ses.access-key-id').returns('AWS_KEY');
      configStub.withArgs('aws.ses.access-key-secret').returns('AWS_SECRET');
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.adapter = 'ses';
      mailerService.initialize({});
      
      const sesSendStub = sandbox.stub(mailerService.sesClient as any, 'send').resolves();

      const emailPayload = {
        to: 'user@example.com',
        subject: 'SES Test',
        text: 'test text',
        html: 'test html',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);

      expect(sesSendStub.calledOnce).to.be.true;
      
      const command = sesSendStub.firstCall.args[0];
      expect(command.input.Source).to.equal('Liquid <test@liquid.com>');
      expect(command.input.Destination.ToAddresses).to.deep.equal(['user@example.com']);
      expect(command.input.Message.Subject.Data).to.equal('SES Test');
      expect(command.input.Message.Body.Text.Data).to.equal('test text');
      expect(command.input.Message.Body.Html.Data).to.equal('test html');
    });
  });

  describe('Pusher Adapter', () => {
    let pusherPublishStub: sinon.SinonStub;

    beforeEach(() => {
      pusherPublishStub = sandbox.stub(Pusher, 'publish').resolves();
    });

    it('should initialize Pusher adapter correctly', () => {
      configStub.withArgs('privilege.can-use-push-events').returns(true);
      configStub.withArgs('system.queue-adapter').returns('redis');
      configStub.withArgs('system.push-events').returns(['liquid.email.send']);

      mailerService.adapter = 'pusher';
      mailerService.initialize({});
      
      expect(mailerService.mode).to.equal('pusher');
    });

    it('should send email payload via Pusher correctly', async () => {
      configStub.withArgs('system.app-name').returns('Liquid');
      configStub.withArgs('email.outbound-address').returns('test@liquid.com');

      mailerService.mode = 'pusher';

      const emailPayload = {
        to: 'user@example.com',
        subject: 'Pusher Test',
        dynamicTemplateData: {}
      };

      await mailerService.send(emailPayload);

      expect(pusherPublishStub.calledOnce).to.be.true;
      
      const pushEvent = pusherPublishStub.firstCall.args[0];
      expect(pushEvent.name).to.equal(PushEventList.EMAIL_SEND);
      expect(pushEvent.data.email.to).to.equal('user@example.com');
      expect(pushEvent.data.email.subject).to.equal('Pusher Test');
      expect(pushEvent.data.email.timestamp).to.be.a('string');
      expect(pushEvent.data.email.from.email).to.equal('test@liquid.com');
    });
  });
});
