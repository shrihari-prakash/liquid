import { IUser } from "../model/mongo/user";
import verificationCodeModel from "../model/mongo/verification-code";
import { Configuration } from "../singleton/configuration";
import { Mailer } from "../singleton/mailer";

export const generateVerificationCode = async function (user: IUser) {
  await verificationCodeModel.deleteMany({ belongsTo: user._id });
  const code = {
    belongsTo: user._id,
    verificationMethod: "email",
    code: require("crypto").randomBytes(18).toString("hex"),
  };
  await new verificationCodeModel(code).save();
  const appName = Configuration.get("app-name") as string;
  const msg: any = {
    to: user.email,
    subject: `${appName}: Verify your account`,
  };
  const templateId = Configuration.get("sendgrid.verification-email-template-id");
  if (templateId) {
    msg.templateId = templateId;
    msg.dynamicTemplateData = {
      app_name: appName,
      code: code.code,
    };
  } else {
    msg.text = `Here's your ${appName} verification code: ${code.code}`;
    msg.html = `Here's your ${appName} verification code: <strong>${code.code}</strong>`;
  }
  await Mailer.send(msg);
  return code;
};
