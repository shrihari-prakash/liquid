import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "mailer" });

import sgMail from "@sendgrid/mail";

import { Configuration } from "../../singleton/configuration";

const Modes = {
  PRINT: "PRINT",
  EMAIL: "EMAIL",
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
    console.log(typeof Configuration.get("get-user-max-items"));
    if (app.get("env") === "production" || Configuration.get("sendgrid.force-send-emails")) {
      this.mode = Modes.EMAIL;
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
    if (this.mode === Modes.EMAIL) {
      await sgMail.send(email as any);
    } else {
      log.info("%o", email);
    }
  }
}
