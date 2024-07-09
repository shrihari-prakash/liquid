import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user-model" });

import mongoose, { ObjectId, Schema } from "mongoose";
import { SensitivityLevel } from "../../enum/sensitivity-level.js";

export const userSchema = {
  username: {
    type: String,
    required: true,
    unique: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  password: {
    type: String,
    required: false,
    select: false,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: false,
    willProjectForUserClientSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  "2faEnabled": {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  "2faMedium": {
    type: String,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  firstName: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  middleName: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  lastName: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  gender: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  preferredLanguage: {
    type: String,
    required: true,
    default: "en",
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  role: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  designation: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  profilePictureUrl: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  profilePicturePath: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  bio: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  customLink: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  pronouns: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  verifiedDate: {
    type: Date,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  followingCount: {
    type: Number,
    required: true,
    default: 0,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.READ_ONLY,
    },
  },
  followerCount: {
    type: Number,
    required: true,
    default: 0,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.READ_ONLY,
    },
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  emailVerified: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  phone: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  phoneCountryCode: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  phoneVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  secondaryEmail: {
    type: String,
    unique: true,
    sparse: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  secondaryEmailVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  secondaryPhone: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  secondaryPhoneCountryCode: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  secondaryPhoneVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM,
    },
  },
  addressLine1: {
    type: String,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  addressLine2: {
    type: String,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  city: {
    type: String,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  country: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  pincode: {
    type: Number,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  organization: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  isSubscribed: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  subscriptionExpiry: {
    type: Date,
    required: false,
    default: Date.now,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  subscriptionTier: {
    type: String,
    required: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  credits: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM,
    },
  },
  scope: {
    type: Array,
    required: true,
    default: ["delegated:all"],
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME,
    },
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  deactivateDate: {
    type: Date,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  isBanned: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  bannedDate: {
    type: Date,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  bannedReason: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  isRestricted: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  restrictedDate: {
    type: Date,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  restrictedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  restrictedReason: {
    type: String,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME,
    },
  },
  deletedDate: {
    type: Date,
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME,
    },
  },
  ssoEnabled: {
    type: Boolean,
    required: false,
    default: false,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: false,
    willProjectForUserClientSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  ssoProvider: {
    type: String,
    enum: ["google"],
    required: false,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: false,
    willProjectForUserClientSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
  creationIp: {
    type: String,
    required: true,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH,
    },
  },
  customData: {
    type: String,
    required: true,
    default: "{}",
    willProjectForUserSelect: true,
    willProjectForUserAdminSelect: true,
    willProjectForUserClientSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH,
    },
  },
  globalLogoutAt: {
    type: Date,
    required: false,
    willProjectForUserSelect: false,
    willProjectForUserAdminSelect: false,
    willProjectForUserClientSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW,
    },
  },
};

export type UserInterface = {
  _id: ObjectId;
  username: string;
  password?: string;
  "2faEnabled": string;
  "2faMedium": string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  preferredLanguage: string;
  role: string;
  designation?: string;
  bio: string;
  profilePictureUrl: string;
  profilePicturePath: string;
  followingCount: string;
  followerCount: string;
  pronouns: string;
  verified: boolean;
  verifiedDate: Date;
  verifiedBy: string;
  customLink: string;
  isPrivate: boolean;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneCountryCode: string;
  phoneVerified: boolean;
  secondaryEmail: string;
  secondaryEmailVerified: boolean;
  secondaryPhone: string;
  secondaryPhoneCountryCode: string;
  secondaryPhoneVerified: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  pincode: number;
  organization: string;
  isSubscribed: boolean;
  subscriptionExpiry: Date;
  subscriptionTier: string;
  credits: number;
  scope: string[];
  invitedBy: string | ObjectId;
  isActive: boolean;
  deactivateDate: Date;
  isBanned: boolean;
  bannedDate: Date;
  bannedBy: string;
  bannedReason: string;
  isRestricted: boolean;
  restrictedDate: Date;
  restrictedBy: string;
  restrictedReason: string;
  isDeleted: boolean;
  deletedDate: Date;
  creationIp: string;
  ssoEnabled: boolean;
  ssoProvider: "google";
  customData: string;
  createdAt: Date;
  updatedAt: Date;
  globalLogoutAt: Date;
  isFollowing?: boolean;
  requested?: boolean;
};

// Build the user projection based on the flag `willProjectForUserSelect` in field definitions.
export const UserProjection: any = {
  _id: 1,
  createdAt: 1,
  updatedAt: 1,
};

export const UserAdminProjection: any = {
  _id: 1,
  createdAt: 1,
  updatedAt: 1,
};

export const UserClientProjection: any = {
  _id: 1,
  createdAt: 1,
  updatedAt: 1,
};

for (const field in userSchema) {
  if (userSchema[field as keyof typeof userSchema].willProjectForUserSelect === true) {
    UserProjection[field] = 1;
  }
  if (userSchema[field as keyof typeof userSchema].willProjectForUserAdminSelect === true) {
    UserAdminProjection[field] = 1;
  }
  if (userSchema[field as keyof typeof userSchema].willProjectForUserClientSelect === true) {
    UserClientProjection[field] = 1;
  }
}

log.debug("User Projection: %o", UserProjection);
log.debug("User Admin Projection: %o", UserAdminProjection);
log.debug("User Client Projection: %o", UserClientProjection);

const schemaInstance = new mongoose.Schema(userSchema, {
    timestamps: true,
  }),
  UserModel = mongoose.model("user", schemaInstance);

export default UserModel;
