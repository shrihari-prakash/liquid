import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "mailer" });

import sgMail from "@sendgrid/mail";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { Configuration } from "../../singleton/configuration";
import { UserInterface } from "../../model/mongo/user";
import VerificationCodeModel from "../../model/mongo/verification-code";

const Modes = {
  PRINT: "print",
  SENDGRID: "sendgrid",
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

  public initialize(app: any) {
    if (Configuration.get("system.email-adapter") === "sendgrid") {
      this.mode = Modes.SENDGRID;
      sgMail.setApiKey(Configuration.get("sendgrid.api-key") as string);
    }
    log.info("Mailer initialized in %s mode ", this.mode);
  }

  public async send(email: Email) {
    if (!email.from) {
      const name = Configuration.get("system.app-name") as string;
      const emailAddress = Configuration.get("sendgrid.outbound-email-address") as string;
      email.from = { email: emailAddress, name };
    }
    if (this.mode === Modes.SENDGRID) {
      await sgMail.send(email as any);
    } else {
      log.info("%o", email);
    }
  }

  public async generateAndSendEmailVerification(user: UserInterface) {
    await VerificationCodeModel.deleteMany({ belongsTo: user._id });
    const code = { belongsTo: user._id, verificationMethod: "email", code: uuidv4() };
    await new VerificationCodeModel(code).save();
    const appName = Configuration.get("system.app-name") as string;
    const fullName = `${user.firstName} ${user.lastName}`;
    const msg: any = { to: user.email, subject: `${appName}: Verify your account` };
    const templateId = Configuration.get("sendgrid.verification-email-template-id");
    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = { person_name: fullName, app_name: appName, verification_code: code.code };
      await this.send(msg);
      return code;
    }
    msg.text = `Hello ${fullName}, Here's your ${appName} verification code: ${code.code}`;
    const templateFile =
      Configuration.get("email.verification-template") || path.join(__dirname, "/templates/verification-code.html");
    const template = await fs.promises.readFile(templateFile, "utf8");
    const html = template
      .replaceAll("%app_name%", appName)
      .replaceAll("%person_name%", fullName)
      .replaceAll("%verification_code%", code.code);
    msg.html = html;
    await this.send(msg);
    return code;
  }
}
