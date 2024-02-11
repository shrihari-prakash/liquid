import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "user-utils" });

import { Response } from "express";
import FollowModel from "../model/mongo/follow";
import UserModel, { UserInterface, UserProjection } from "../model/mongo/user";
import { Configuration } from "../singleton/configuration";
import { errorMessages, statusCodes } from "./http-status";
import { ErrorResponse } from "./response";
import { FollowStatus } from "../enum/follow-status";
import { checkSubscription } from "./subscription";
import { attachProfilePicture } from "./profile-picture";

export const canRequestFollowerInfo = async ({
  sourceId,
  targetId,
  target,
  res,
}: {
  sourceId: string;
  targetId?: string;
  target?: UserInterface;
  res?: Response;
}): Promise<boolean> => {
  let user = target;
  if (!user) {
    user = (await UserModel.findOne({ _id: targetId }, UserProjection).exec()) as unknown as UserInterface;
  }
  if (!user.isPrivate) {
    return true;
  }
  if (Configuration.get("privilege.can-use-follow-apis")) {
    const followEntry = (await FollowModel.findOne({
      $and: [{ targetId }, { sourceId }],
    }).exec()) as any;
    user = JSON.parse(JSON.stringify(user)) as UserInterface;
    if (!followEntry) {
      user.isFollowing = false;
    } else {
      if (followEntry.approved) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
        user.requested = true;
      }
    }
    if (user.isFollowing) {
      return true;
    }
  }
  if (res) {
    res.status(statusCodes.forbidden).json(
      new ErrorResponse(errorMessages.forbidden, {
        reason: FollowStatus.NOT_FOLLOWING,
      })
    );
  }
  return false;
};

export const sanitizeEditableFields = () => {
  const fieldsBlockedForDirectPatch = [
    "2faEnabled",
    "2faMedium",
    "isSubscribed",
    "subscriptionExpiry",
    "subscriptionTier",
    "isBanned",
    "bannedDate",
    "bannedBy",
    "bannedReason",
    "isRestricted",
    "restrictedDate",
    "restrictedReason",
    "restrictedBy",
    "verified",
    "verifiedDate",
    "verifiedBy",
    "profilePictureUrl",
    "profilePicturePath",
    "scope",
    "credits",
    "customData",
    "createdAt",
    "updatedAt",
  ];
  const makeMessage = (option: string) =>
    `Misconfiguration detected in "${option}". Fields related to permissions, subscriptions, verifications, banning and restrictions should not be mutated directly. Instead use the APIs intented for them. Invalid fields have been filtered out.`;
  const editableFields = Configuration.get("user.profile.editable-fields");
  const sanitizedEditableFields = editableFields.filter(
    (field: string) => !fieldsBlockedForDirectPatch.includes(field)
  );
  if (editableFields.length !== sanitizedEditableFields.length) {
    log.warn(makeMessage("user.profile.editable-fields"));
    Configuration.set("user.profile.editable-fields", sanitizedEditableFields.join(","));
    log.warn("Final list of fields %o", Configuration.get("user.profile.editable-fields"));
  }
  const adminEditableFields = Configuration.get("admin-api.user.profile.editable-fields");
  const sanitizedAdminEditableFields = adminEditableFields.filter(
    (field: string) => !fieldsBlockedForDirectPatch.includes(field)
  );
  if (adminEditableFields.length !== sanitizedAdminEditableFields.length) {
    log.warn(makeMessage("admin-api.user.profile.editable-fields"));
    Configuration.set("admin-api.user.profile.editable-fields", sanitizedAdminEditableFields.join(","));
    log.warn("Final list of fields %o", Configuration.get("admin-api.user.profile.editable-fields"));
  }
};

const canShowCustomDataInDelegatedMode = Configuration.get("user.profile.custom-data.hydrate-in-delegated-mode");
const canShowCustomDataInSelfRetrieval = Configuration.get("user.profile.custom-data.hydrate-in-self-retrieval");

export interface UserHydrationOptions {
  delegatedMode?: boolean;
  selfRetrieve?: boolean;
}

const _hydrateUserProfile = async (user: UserInterface, options: UserHydrationOptions) => {
  if ((user.isDeleted || user.isBanned) && options.delegatedMode) {
    const dummyUser = {
      _id: user._id,
      isDeleted: user.isDeleted,
      isBanned: user.isBanned,
      customData: "{}",
    };
    return dummyUser;
  }
  checkSubscription(user);
  await attachProfilePicture(user);
  if (!user.customData) {
    return user;
  }
  if (options.selfRetrieve && !canShowCustomDataInSelfRetrieval) {
    log.debug("Custom data hydration for %s skipped due to self retrievel block.", user._id);
    // @ts-expect-error
    user.customData = undefined;
    return user;
  } else if (options.delegatedMode && !canShowCustomDataInDelegatedMode) {
    log.debug("Custom data hydration for %s skipped due to delegation block.", user._id);
    // @ts-expect-error
    user.customData = undefined;
    return user;
  }
  log.debug("Custom data hydrated for %s.", user._id);
  user.customData = user.customData ? JSON.parse(user.customData) : undefined;
  return user;
};

export const hydrateUserProfile = async (user: UserInterface | UserInterface[], options: UserHydrationOptions = {}) => {
  if (Array.isArray(user)) {
    for (let i = 0; i < user.length; i++) {
      await _hydrateUserProfile(user[i], options);
    }
  } else {
    await _hydrateUserProfile(user, options);
  }
};
