import { UserInterface } from "../model/mongo/user.js";
import { profilePicturePath } from "../service/api/user/profile-picture.patch.js";
import { Configuration } from "../singleton/configuration.js";
import { S3 } from "../singleton/s3.js";

export const attachProfilePicture = async (user: UserInterface) => {
  if (!Configuration.get("privilege.can-use-profile-picture-apis")) {
    return user;
  }
  const expiry = Configuration.get("user.profile-picture.signed-url.expiry");
  if (user.profilePicturePath) {
    const fileName = `${profilePicturePath}/${user._id}.png`;
    user.profilePictureUrl = (await S3.getSignedUrl("GET", fileName, {}, expiry)) as string;
    // @ts-expect-error
    user.profilePicturePath = undefined;
  } else {
    (user as any).profilePictureUrl = null;
  }
  return user;
};
