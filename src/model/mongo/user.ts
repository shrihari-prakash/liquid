import mongoose, { ObjectId } from "mongoose";

const userSchema = {
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  profilePictureUrl: String,
  bio: String,
  followingCount: {
    type: Number,
    required: true,
    default: 0,
  },
  followerCount: {
    type: Number,
    required: true,
    default: 0,
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  emailVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  phone: String,
  phoneCountryCode: String,
  phoneVerified: Boolean,
  secondaryEmail: {
    type: String,
    unique: true,
    sparse: true,
  },
  secondaryEmailVerified: Boolean,
  secondaryPhone: String,
  secondaryPhoneCountryCode: String,
  secondaryPhoneVerified: Boolean,
  addressLine1: String,
  addressLine2: String,
  city: String,
  country: String,
  pincode: Number,
  isSubscribed: {
    type: Boolean,
    required: true,
    select: false,
    default: false,
  },
  subscriptionExpiry: {
    type: Date,
    required: true,
    select: false,
    default: Date.now(),
  },
  subscriptionTier: {
    type: String,
    required: true,
    select: false,
    default: "default",
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  deactivateDate: Date,
  isBanned: {
    type: Boolean,
    required: true,
    default: false,
  },
  bannedDate: Date,
  bannedReason: String,
  isRestricted: {
    type: Boolean,
    required: true,
    default: false,
  },
  restrictedReason: String,
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  deletedDate: Date,
  allowedAdminAPIs: {
    type: Array,
    required: true,
    default: [],
  },
};

const schemaInstance = new mongoose.Schema(userSchema, {
    timestamps: true,
  }),
  UserModel = mongoose.model("user", schemaInstance);

export type IUser = {
  _id: ObjectId;
  username: string;
  password?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: string;
  bio: string;
  profilePictureUrl: string;
  followingCount: string;
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
  isSubscribed: boolean;
  subscriptionExpiry: Date;
  subscriptionTier: string;
  isActive: boolean;
  deactivateDate: Date;
  isBanned: boolean;
  bannedDate: Date;
  bannedReason: string;
  isRestricted: boolean;
  restrictedReason: string;
  deleted: boolean;
  deletedDate: Date;
  allowedAdminAPIs: string[];
  isFollowing?: boolean;
};

export const IUserProjection = {
  _id: 1,
  username: 1,
  firstName: 1,
  middleName: 1,
  lastName: 1,
  bio: 1,
  profilePictureUrl: 1,
  followingCount: 1,
  followerCount: 1,
  isPrivate: 1,
  email: 1,
  phone: 1,
  secondaryEmail: 1,
  secondaryPhone: 1,
  isBanned: 1,
  isRestricted: 1,
};

export default UserModel;
