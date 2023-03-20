import UserModel, { IUser } from "../model/mongo/user";
import { profilePicturePath } from "../service/api/user/profile-picture.patch";
import { S3 } from "../singleton/s3";

export const attachProfilePicture = async (input: IUser | IUser[]) => {
  if (Array.isArray(input)) {
    const users = input;
    for (let i = 0; i < users.length; i++) {
      if (users[i].profilePicturePath) {
        const fileName = `${profilePicturePath}/${users[i]._id}.png`;
        users[i].profilePictureUrl = await S3.getSignedUrl("GET", fileName);
      }
    }
    return users;
  } else {
    const user = input;
    if (user.profilePicturePath) {
      const fileName = `${profilePicturePath}/${user._id}.png`;
      user.profilePictureUrl = await S3.getSignedUrl("GET", fileName);
    }
    return user;
  }
};
