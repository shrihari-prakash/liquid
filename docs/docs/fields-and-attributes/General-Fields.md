---
title: General Fields
---

Liquid offers a large variety of fields and attributes that you can use for various purposes. These fields are typically categorized into 3 categories according to how sensitive they are. Below is a list of all fields along with their sensitivity levels:
| Field Name | Sensitivity Level | Field Validations Availability |
|-------------------|-------------------|-------------------------------|
| firstName | Low | Yes |
| middleName | Low | Yes |
| lastName | Low | Yes |
| gender | Low | Yes |
| preferredLanguage | Low | Yes |
| designation | Low | Yes |
| bio | Low | Yes |
| customLink | Low | Yes |
| pronouns | Low | Yes |
| organization | Low | Yes |
| ssoEnabled | Low | Yes |
| ssoProvider | Low | Yes |
| email | Medium | Yes |
| emailVerified | Medium | Yes |
| secondaryEmail | Medium | Yes |
| secondaryEmailVerified | Medium | Yes |
| phone | Medium | Yes |
| phoneVerified | Medium | Yes |
| secondaryPhone | Medium | Yes |
| secondaryPhoneVerified | Medium | Yes |
| username | High | Yes |
| password | High | Yes |
| role | High | Yes |
| addressLine1| High | No |
| addressLine2| High | No |
| city| High | No |
| country | High | Yes |
| pincode| High | No |

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

### More Fields
If these set of fields are not enough for your use case, you can extend the user object by using the [Custom Data](/fields-and-attributes/Custom-Data) mechanism.