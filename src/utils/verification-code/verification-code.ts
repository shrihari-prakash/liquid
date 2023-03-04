var fs = require("fs");
import { v4 as uuidv4 } from "uuid";

import { IUser } from "../../model/mongo/user";
import verificationCodeModel from "../../model/mongo/verification-code";
import { Configuration } from "../../singleton/configuration";
import { Mailer } from "../../singleton/mailer";

export const generateVerificationCode = async function (user: IUser) {
  await verificationCodeModel.deleteMany({ belongsTo: user._id });
  const code = {
    belongsTo: user._id,
    verificationMethod: "email",
    code: uuidv4(),
  };
  await new verificationCodeModel(code).save();
  const appName = Configuration.get("system.app-name") as string;
  const fullName = `${user.firstName} ${user.lastName}`;
  const msg: any = {
    to: user.email,
    subject: `${appName}: Verify your account`,
  };
  const templateId = Configuration.get("sendgrid.verification-email-template-id");
  if (templateId) {
    msg.templateId = templateId;
    msg.dynamicTemplateData = {
      name: fullName,
      app_name: appName,
      code: code.code,
    };
  } else {
    msg.text = `Hello ${fullName}, Here's your ${appName} verification code: ${code.code}`;
    const template = await fs.promises.readFile(__dirname + "/verification-code.html", "utf8");
    let html = template.replace(/{{APP_NAME}}/g, appName);
    html = html.replace(/{{USER_NAME}}/g, fullName);
    html = html.replace(/{{CODE}}/g, code.code);
    msg.html = html;
    await Mailer.send(msg);
  }
  return code;
};
