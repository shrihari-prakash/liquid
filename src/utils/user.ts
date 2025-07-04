import { Logger } from "../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user-utils" });

import FollowModel from "../model/mongo/follow.js";
import UserModel, { UserInterface, UserProjection } from "../model/mongo/user.js";
import { Configuration } from "../singleton/configuration.js";
import { checkSubscription } from "./subscription.js";
import { attachProfilePicture } from "./profile-picture.js";

interface FollowingResult {
  results: boolean[];
  positiveIndices: number[];
  negativeIndices: number[];
}

export const isFollowing = async ({
  sourceId,
  targetIds,
  targets,
}: {
  sourceId: string;
  targetIds?: string[];
  targets?: UserInterface[];
}): Promise<FollowingResult> => {
  const results = [];
  const positiveIndices = [];
  const negativeIndices = [];
  if (!Configuration.get("privilege.can-use-follow-apis")) {
    return { results: [], positiveIndices: [], negativeIndices: [] };
  }
  if (!targets && targetIds) {
    targets = [];
    for (let i = 0; i < targetIds.length; i++) {
      const user = (await UserModel.findOne({ _id: targetIds[i] }, UserProjection)
        .lean()
        .exec()) as unknown as UserInterface;
      targets.push(user);
    }
  }
  targets = targets as UserInterface[];
  for (let i = 0; i < targets.length; i++) {
    let target = targets[i];
    const followEntry = (await FollowModel.findOne({
      $and: [{ targetId: target._id }, { sourceId }],
    })
      .lean()
      .exec()) as any;
    target = JSON.parse(JSON.stringify(target)) as UserInterface;
    if (!followEntry) {
      target.isFollowing = false;
    } else {
      if (followEntry.approved) {
        target.isFollowing = true;
      } else {
        target.isFollowing = false;
        target.requested = true;
      }
    }
    results.push(target.isFollowing);
    if (target.isFollowing) {
      positiveIndices.push(results.length - 1);
    }
    if (!target.isFollowing) {
      negativeIndices.push(results.length - 1);
    }
  }
  return { results, positiveIndices, negativeIndices };
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
    // Replace user properties with dummy data for deleted/banned users in delegated mode
    Object.keys(user).forEach(key => {
      if (key !== '_id' && key !== 'isDeleted' && key !== 'isBanned') {
        // @ts-expect-error
        delete user[key];
      }
    });
    user.customData = "{}";
    return user;
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

export const stripSensitiveFieldsForNonFollowerGet = (user: UserInterface) => {
  const fieldsToRemove = Configuration.get("user.field-privacy.non-follower.hidden-fields");
  for (let i = 0; i < fieldsToRemove.length; i++) {
    const field = fieldsToRemove[i];
    // @ts-expect-error
    user[field] = undefined;
  }
  return user;
};
