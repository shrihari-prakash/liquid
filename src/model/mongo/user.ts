import { Logger } from "../../singleton/logger";
const log = Logger.getLogger().child({ from: "user-model" });

import mongoose, { ObjectId, Schema } from "mongoose";
import { SensitivityLevel } from "../../enum/sensitivity-level";

export const userSchema = {
  username: {
    type: String,
    required: true,
    unique: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  firstName: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  middleName: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  lastName: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  gender: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  preferredLanguage: {
    type: String,
    required: true,
    default: "en",
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  role: {
    type: String,
    required: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  designation: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  profilePictureUrl: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  profilePicturePath: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  bio: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  customLink:
  {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  pronouns: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  verifiedDate: {
    type: Date,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  followingCount: {
    type: Number,
    required: true,
    default: 0,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.READ_ONLY
    },
  },
  followerCount: {
    type: Number,
    required: true,
    default: 0,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.READ_ONLY
    },
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  emailVerified: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  phone: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  phoneCountryCode: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  phoneVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  secondaryEmail: {
    type: String,
    unique: true,
    sparse: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  secondaryEmailVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  secondaryPhone: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  secondaryPhoneCountryCode: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  secondaryPhoneVerified: {
    type: Boolean,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.MEDIUM
    },
  },
  addressLine1: {
    type: String,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  addressLine2: {
    type: String,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  city: {
    type: String,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  country: {
    type: String,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  pincode: {
    type: Number,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
  organization: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  isSubscribed: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  subscriptionExpiry: {
    type: Date,
    required: false,
    default: Date.now,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  subscriptionTier: {
    type: String,
    required: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  credits: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.MEDIUM,
      write: SensitivityLevel.MEDIUM
    },
  },
  scope: {
    type: Array,
    required: true,
    default: ["delegated:all"],
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME
    },
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  deactivateDate: {
    type: Date,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.LOW
    },
  },
  isBanned: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  bannedDate: {
    type: Date,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  bannedReason: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  isRestricted: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  restrictedDate: {
    type: Date,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  restrictedReason: {
    type: String,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.HIGH
    },
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME
    },
  },
  deletedDate: {
    type: Date,
    willProjectForUserSelect: true,
    sensitivityScore: {
      read: SensitivityLevel.LOW,
      write: SensitivityLevel.EXTREME
    },
  },
  creationIp: {
    type: String,
    required: true,
    willProjectForUserSelect: false,
    sensitivityScore: {
      read: SensitivityLevel.HIGH,
      write: SensitivityLevel.HIGH
    },
  },
};

export type UserInterface = {
  _id: ObjectId;
  username: string;
  password?: string;
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
  pronouns: string;
  verified: boolean;
  verifiedDate: Date;
  customLink: string;
  followerCount: string;
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
  bannedReason: string;
  isRestricted: boolean;
  restrictedDate: Date;
  restrictedReason: string;
  deleted: boolean;
  deletedDate: Date;
  creationIp: string;
  createdAt: Date;
  updatedAt: Date;
  isFollowing?: boolean;
  requested?: boolean;
};

// Build the user projection based on the flag `willProjectForUserSelect` in field definitions.
export const UserProjection: any = {
  _id: 1,
  createdAt: 1,
  updatedAt: 1,
};
for (const field in userSchema) {
  if (userSchema[field as keyof typeof userSchema].willProjectForUserSelect === true) {
    UserProjection[field] = 1;
  }
}
log.debug("UserProjection:");
log.debug(UserProjection);

const schemaInstance = new mongoose.Schema(userSchema, {
  timestamps: true,
}),
  UserModel = mongoose.model("user", schemaInstance);

export default UserModel;
