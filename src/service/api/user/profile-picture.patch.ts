import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/unfollow" });

import { Request, Response } from "express";
const multer = require("multer");
const multerS3 = require("multer-s3");

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { Configuration } from "../../../singleton/configuration";
import { S3 } from "../../../singleton/s3";
import UserModel from "../../../model/mongo/user";

let profilePictureMulter;

if (Configuration.get("privilege.can-use-cloud-storage")) {
  profilePictureMulter = multer({
    limits: {
      fileSize: Configuration.get("user.profile-picture.max-file-size"),
    },
    fileFilter: (_: any, file: any, cb: any) => {
      if (file.mimetype !== "image/png") {
        return cb(new ErrorResponse(errorMessages.invalidFile));
      }
      cb(null, true);
    },
    storage: multerS3({
      s3: S3.client,
      bucket: Configuration.get("s3.bucket-name"),
      metadata: function (req: any, _: any, cb: any) {
        const userId = req.res?.locals.oauth.token.user._id;
        cb(null, { fieldName: userId });
      },
      key: function (req: Request, _: any, cb: any) {
        const userId = req.res?.locals.oauth.token.user._id;
        cb(null, `${profilePicturePath}/${userId}.png`);
      },
    }),
  });
} else {
  log.warn(
    "Usage of profile picture APIs are enabled, however, the option Can Use Cloud Storage (privilege.can-use-cloud-storage) is disabled. This means uploading profile pictures will do nothing until you enable the option and configure S3."
  );
  profilePictureMulter = {
    single: () => (_: unknown, __: unknown, cb: any) => cb(),
  };
}

const uploadProfilePicture = profilePictureMulter.single("profile-picture");

export const profilePicturePath = `${Configuration.get("storage.cloud-path")}/profile-pictures`;

const PATCH_ProfilePicture = async (req: Request, res: Response) => {
  try {
    uploadProfilePicture(req, res, async function (err: any) {
      if (err) {
        console.log(err);
        return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidFile));
      }
      const userId = req.res?.locals.oauth.token.user._id;
      const fileName = `${profilePicturePath}/${userId}.png`;
      const signedUrl = await S3.getSignedUrl("GET", fileName);
      await UserModel.updateOne({ _id: userId }, { $set: { profilePicturePath: fileName } }).exec();
      res.status(statusCodes.success).json(new SuccessResponse({ signedUrl }));
    });
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default PATCH_ProfilePicture;
