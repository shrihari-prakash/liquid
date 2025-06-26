import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "mailer" });

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

import { Configuration } from "../../singleton/configuration.js";
import { Pusher } from "../../singleton/pusher.js";
import { PushEvent } from "../pusher/pusher.js";
import { PushEventList } from "../../enum/push-events.js";
import { UserInterface } from "../../model/mongo/user.js";
import VerificationCodeModel from "../../model/mongo/verification-code.js";
import { VerificationCodeType } from "../../enum/verification-code.js";
import { makeToken } from "../../utils/token.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Modes = {
  PRINT: "print",
  SENDGRID: "sendgrid",
  NODEMAILER: "nodemailer",
  SES: "ses",
  PUSHER: "pusher",
};

interface Email {
  to: string;
  from?: {
    email: string;
    name: string;
  };
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData: any;
}

export class Mailer {
  mode = Modes.PRINT;
  transporter?: ReturnType<typeof nodemailer.createTransport>;
  sesClient?: SESClient;
  adapter = Configuration.get("system.email-adapter");

  public initialize(app: any) {
    log.debug("System outbound email address: %s", Configuration.get("email.outbound-address"));
    switch (this.adapter) {
      case Modes.SENDGRID:
        this.initializeSendgrid();
        break;
      case Modes.NODEMAILER:
        this.initializeNodemailer();
        break;
      case Modes.SES:
        this.initializeSES();
        break;
      case Modes.PUSHER:
        this.initializePusher();
        break;
      default:
        log.info("Mailer initialized in PRINT mode.");
        break;
    }
    log.info("Mailer initialized in %s mode. ", this.mode);
  }

  private initializeSendgrid() {
    this.mode = Modes.SENDGRID;
    sgMail.setApiKey(Configuration.get("sendgrid.api-key") as string);
    log.info("Sendgrid email adapter initialized");
  }

  private initializeNodemailer() {
    this.mode = Modes.NODEMAILER;
    this.transporter = nodemailer.createTransport({
      service: Configuration.get("nodemailer.service-name"),
      host: Configuration.get("nodemailer.host"),
      port: Configuration.get("nodemailer.port"),
      secure: Configuration.get("nodemailer.secure"),
      auth: {
        user: Configuration.get("nodemailer.username"),
        pass: Configuration.get("nodemailer.password"),
      },
      requireTLS: true,
      tls: {
        ciphers: Configuration.get("nodemailer.ciphers"),
        rejectUnauthorized: Configuration.get("nodemailer.reject-unauthorized"),
      },
    });
    this.transporter.verify(function (error: any) {
      if (error) {
        log.error("Verification failed");
        log.error(error);
      } else {
        log.info("Nodemailer is ready.");
      }
    });
    log.info("Nodemailer email adapter initialized");
  }

  private initializeSES() {
    this.mode = Modes.SES;
    this.sesClient = new SESClient({
      region: Configuration.get("aws.ses.region") as string,
      credentials: {
        accessKeyId: Configuration.get("aws.ses.access-key-id") as string,
        secretAccessKey: Configuration.get("aws.ses.access-key-secret") as string,
      },
    });
    log.info("AWS SES client initialized");
  }

  private initializePusher() {
    this.mode = Modes.PUSHER;

    if (!Configuration.get("privilege.can-use-push-events")) {
      log.warn(
        "Pusher mode enabled for mailer but privilege.can-use-push-events is not enabled. Emails will not be sent.",
      );
    } else {
      const queueAdapter = Configuration.get("system.queue-adapter");
      if (queueAdapter !== "redis" && queueAdapter !== "rabbitmq") {
        log.warn(
          `Pusher mode enabled for mailer but unknown queue adapter: ${queueAdapter}. Emails may not be processed correctly.`,
        );
      }

      const pushEvents = Configuration.get("system.push-events") as string[];
      if (!pushEvents.includes(PushEventList.EMAIL_SEND)) {
        log.warn(
          `'${PushEventList.EMAIL_SEND}' event is not included in system.push-events. Add it to enable email sending via Pusher.`,
        );
      }

      log.info("Pusher email adapter initialized");
    }
  }

  public async send(email: Email) {
    if (!email.from) {
      const name = Configuration.get("system.app-name") as string;
      const emailAddress =
        Configuration.get("email.outbound-address") || Configuration.get("sendgrid.outbound-email-address");
      email.from = { email: emailAddress, name };
    }

    switch (this.mode) {
      case Modes.PUSHER:
        await this.sendViaPusher(email);
        break;
      case Modes.SENDGRID:
        await this.sendViaSendgrid(email);
        break;
      case Modes.NODEMAILER:
        await this.sendViaNodemailer(email);
        break;
      case Modes.SES:
        await this.sendViaSES(email);
        break;
      default:
        this.printEmail(email);
        break;
    }
  }

  private async sendViaPusher(email: Email) {
    try {
      const pushEvent = new PushEvent(PushEventList.EMAIL_SEND, {
        email: {
          ...email,
          timestamp: new Date().toISOString(),
        },
      });

      await Pusher.publish(pushEvent);
      log.info("Email published to message queue via Pusher");
    } catch (error) {
      log.error("Error publishing email to Pusher:", error);
      throw error;
    }
  }

  private async sendViaSendgrid(email: Email) {
    await sgMail.send(email as any);
  }

  private async sendViaNodemailer(email: Email) {
    (email.from as any) = `${email.from?.name} <${email.from?.email}>`;
    await (this.transporter as ReturnType<typeof nodemailer.createTransport>).sendMail(email as any);
  }

  private async sendViaSES(email: Email) {
    const command = new SendEmailCommand({
      Source: `${email.from?.name} <${email.from?.email}>`,
      Destination: {
        ToAddresses: [email.to],
      },
      Message: {
        Subject: {
          Data: email.subject,
          Charset: "UTF-8",
        },
        Body: {
          ...(email.html && {
            Html: {
              Data: email.html,
              Charset: "UTF-8",
            },
          }),
          ...(email.text && {
            Text: {
              Data: email.text,
              Charset: "UTF-8",
            },
          }),
        },
      },
    });

    try {
      await this.sesClient?.send(command);
      log.info("Email sent successfully with AWS SES");
    } catch (error) {
      log.error("Error sending email with AWS SES:", error);
      throw error;
    }
  }

  private printEmail(email: Email) {
    log.info("%o", email);
  }

  public async generateAndSendEmailVerification(user: UserInterface, type: string) {
    await VerificationCodeModel.deleteMany({ belongsTo: user._id });
    const code: any = {
      belongsTo: user._id,
      verificationMethod: "email",
      code: Math.floor(100000 + Math.random() * 900000) + "",
      type,
    };
    if (type === VerificationCodeType.LOGIN) {
      code.sessionHash = makeToken(64);
    }
    await new VerificationCodeModel(code).save();
    const appName = Configuration.get("system.app-name") as string;
    const fullName = `${user.firstName} ${user.lastName}`;
    const msg: any = { to: user.email, subject: `${appName}: Verify your account` };
    const templateId = Configuration.get("sendgrid.verification-email-template-id");
    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = {
        person_id: user._id.toString(),
        person_name: fullName,
        app_name: appName,
        verification_code: code.code,
      };
      await this.send(msg);
      return code;
    }
    msg.text = `Hello ${fullName}, Here's your ${appName} verification code: ${code.code}`;
    const templateFile =
      Configuration.get("email.verification-template") || path.join(__dirname, "/templates/verification-code.html");
    log.debug("Email template file name: %s", templateFile);
    const template = await fs.promises.readFile(templateFile, "utf8");
    const html = template
      .replaceAll("%app_name%", appName)
      .replaceAll("%person_name%", fullName)
      .replaceAll("%person_id%", user._id.toString())
      .replaceAll("%verification_code%", code.code);
    msg.html = html;
    await this.send(msg);
    return code;
  }
}

