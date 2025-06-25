import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "mailer" });

import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

import { Configuration } from "../../singleton/configuration.js";
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
    if (this.adapter === Modes.SENDGRID) {
      this.mode = Modes.SENDGRID;
      sgMail.setApiKey(Configuration.get("sendgrid.api-key") as string);
    } else if (this.adapter === Modes.NODEMAILER) {
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
    } else if (this.adapter === Modes.SES) {
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
    log.info("Mailer initialized in %s mode. ", this.mode);
  }

  public async send(email: Email) {
    if (!email.from) {
      const name = Configuration.get("system.app-name") as string;
      const emailAddress =
        Configuration.get("email.outbound-address") || Configuration.get("sendgrid.outbound-email-address");
      email.from = { email: emailAddress, name };
    }
    if (this.mode === Modes.SENDGRID) {
      await sgMail.send(email as any);
    } else if (this.mode === Modes.NODEMAILER) {
      (email.from as any) = `${email.from.name} <${email.from.email}>`;
      await (this.transporter as ReturnType<typeof nodemailer.createTransport>).sendMail(email as any);
    } else if (this.mode === Modes.SES) {
      const command = new SendEmailCommand({
        Source: `${email.from.name} <${email.from.email}>`,
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
    } else {
      log.info("%o", email);
    }
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

