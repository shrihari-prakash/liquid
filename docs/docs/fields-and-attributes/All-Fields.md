---
title: All Fields
---

Liquid offers a large variety of fields and attributes that you can use for various purposes. These fields are typically categorized into 3 categories according to how sensitive they are. Below is a list of all fields along with their sensitivity levels:

Field Name | Sensitivity Level (Write) | Type | Readable by Admin | Readable by Client | Readable by Delegated User | Patchable / Related API
--- | --- | --- | --- | --- | --- | ---
username | HIGH | String | Yes | Yes | Yes | Yes
password | HIGH | String | No | No | No | Yes
2faEnabled | HIGH | Boolean | Yes | Yes | No | [2FA](/features/Two-Factor-Authentication)
2faMedium | HIGH | String | Yes | Yes | No | [2FA](/features/Two-Factor-Authentication)
firstName | LOW | String | Yes | Yes | Yes | Yes
middleName | LOW | String | Yes | Yes | Yes | Yes
lastName | LOW | String | Yes | Yes | Yes | Yes
gender | LOW | String | Yes | Yes | Yes | Yes
preferredLanguage | LOW | String | Yes | Yes | Yes | Yes
role | HIGH | String | Yes | Yes | Yes | Yes
designation* | LOW | String | Yes | Yes | Yes | Yes
profilePictureUrl | MEDIUM | String | Yes | Yes | Yes | [Profile Pictures](/features/Profile-Pictures)
profilePicturePath | MEDIUM | String | Yes | Yes | Yes | [Profile Pictures](/features/Profile-Pictures)
bio | LOW | String | Yes | Yes | Yes | Yes
customLink | LOW | String | Yes | Yes | Yes | Yes
pronouns | LOW | String | Yes | Yes | Yes | Yes
verified | HIGH | Boolean | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
verifiedDate | LOW | Date | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
verifiedBy | LOW | ObjectId | Yes | Yes | No | [Special Field](/fields-and-attributes/Special-Fields)
followingCount | READ_ONLY | Number | Yes | Yes | Yes | [Follow API](/api-documentation/API-Documentation-Delegated#follow)
followerCount | READ_ONLY | Number | Yes | Yes | Yes | [Follow API](/api-documentation/API-Documentation-Delegated#follow)
isPrivate | MEDIUM | Boolean | Yes | Yes | Yes | [Private Account API](/api-documentation/API-Documentation-Delegated#switch-to-private-account)
email | MEDIUM | String | Yes | Yes | Yes | Yes
emailVerified | MEDIUM | Boolean | Yes | Yes | Yes | No
phone* | MEDIUM | String | Yes | Yes | Yes | Yes
phoneCountryCode | MEDIUM | String | Yes | Yes | Yes | Yes
phoneVerified | MEDIUM | Boolean | Yes | Yes | Yes | No
secondaryEmail | MEDIUM | String | Yes | Yes | Yes | Yes
secondaryEmailVerified | MEDIUM | Boolean | Yes | Yes | Yes | No
secondaryPhone* | MEDIUM | String | Yes | Yes | Yes | Yes
secondaryPhoneCountryCode* | MEDIUM | String | Yes | Yes | Yes | Yes
secondaryPhoneVerified* | MEDIUM | Boolean | Yes | Yes | Yes | No
addressLine1* | HIGH | String | Yes | Yes | No | Yes
addressLine2* | HIGH | String | Yes | Yes | No | Yes
city* | HIGH | String | Yes | Yes | No | Yes
country | HIGH | String | Yes | Yes | Yes | Yes
pincode* | HIGH | Number | Yes | Yes | No | Yes
organization | LOW | String | Yes | Yes | Yes | Yes
isSubscribed | MEDIUM | Boolean | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
subscriptionExpiry | MEDIUM | Date | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
subscriptionTier | MEDIUM | String | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
credits | MEDIUM | Number | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
scope | EXTREME | Array | Yes | Yes | No | [Access Provisioning](/api-documentation/API-Documentation-Admin#access-provisioning)
invitedBy | LOW | ObjectId | Yes | Yes | Yes | [Invite Only Mode](/features/Invite-Only-Mode)
isActive | LOW | Boolean | Yes | Yes | Yes | NA
deactivateDate | LOW | Date | Yes | Yes | No | NA
isBanned | HIGH | Boolean | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
bannedDate | HIGH | Date | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
bannedBy | LOW | ObjectId | Yes | Yes | No | [Special Field](/fields-and-attributes/Special-Fields)
bannedReason | HIGH | String | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
isRestricted | HIGH | Boolean | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
restrictedDate | HIGH | Date | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
restrictedBy | LOW | ObjectId | Yes | Yes | No | [Special Field](/fields-and-attributes/Special-Fields)
restrictedReason | HIGH | String | Yes | Yes | Yes | [Special Field](/fields-and-attributes/Special-Fields)
isDeleted | EXTREME | Boolean | Yes | Yes | Yes | NA
deletedDate | EXTREME | Date | Yes | Yes | Yes | NA
ssoEnabled | LOW | Boolean | No | No | No | [Google SSO](/features/Google-SSO)
ssoProvider | LOW | String | No | No | No | [Google SSO](/features/Google-SSO)
googleProfileId | MEDIUM | String | No | No | No | [Google SSO](/features/Google-SSO)
creationIp | HIGH | String | Yes | Yes | No | No
customData | HIGH | String | Yes | Yes | Yes | [Custom Data](/fields-and-attributes/Custom-Data)
globalLogoutAt | LOW | Date | No | No | No | No

`*` - Field patchable, but validations are not available.

## Updating Fields

Liquid provides granular control on who can change what fields of a user.

### For delegated users

When fields are changed by a user themselves, it is possible to control which fields they can edit by listing the editable fields in the option `user.profile.editable-fields`.

### For admin users

When fields are updated by admins, the process is much more sophisticated:

Before you start, give your admins the permissions `admin:profile:read`, `admin:profile:write` and `admin:configuration:read`. Adjust the editable fields for admins by using option `admin-api.user.profile.editable-fields`.

If you want to be more granular about the field write access per person, they can be granted specifically scopes that allow editing a field that lies in a particular sensitivity level.

Once you have identified the level of write access you want to provide a user, you can provide them the respective scope in the format `admin:profile:sensitive:<sensitivity-level>:write`. Note that sensitivity extreme does not immediately grant access to sensitivity low, medium and high. Sensitivity levels have to be provided for all required levels.

By default, Liquid does not allow editing anything before assigning the sensitivity scopes.

When editing roles, the role sent in the body should be of less priority in ranking than the user that is requesting the API unless the requesting user is a super_admin. For instance, a user with role ‘user’ cannot make someone an ‘admin’.

Most of these fields can be updated using [Update User Fields (Delegated)](/api-documentation/API-Documentation-Delegated#update-user-info) or [Update User Fields (Admin)](/api-documentation/API-Documentation-Admin#update-user-info), but some fields are special and cannot be updated directly by PATCH APIs. Such fields are related to special features of Liquid and the documentation for usage is linked in the `Related API` field of the table above.

### More Fields

If these set of fields are not enough for your use case, you can extend the user object by using the [Custom Data](/fields-and-attributes/Custom-Data) mechanism.
