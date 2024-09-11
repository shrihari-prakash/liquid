---
title: "API-Documentation: Admin"
---

# Introducing Liquid Nitrogen!
To take administrative actions like managing users, connected apps and permissions, it is recommended that you use [The Nitrogen Project](https://github.com/shrihari-prakash/nitrogen) instead of rolling your own admin management portal. Nitrogen seamlessly connects with any Liquid instance with minimal configuration and uses the same administrative APIs under the hood.

If you still want to use the admin APIs for some reason, all of them are documented in this page.

![Liquid Nitrogen](https://github.com/shrihari-prakash/nitrogen/raw/main/images/banner.png)
 
# Admin APIs

Restricted to system admins. Super Admin role has access to all these APIs. To provide access to other users, Super Admin needs to explicitly provide permissions using POST `user/admin-api/access` API. Needs an `authorization_code` grant login.

<details>
<summary>
### Access Provisioning
<br/>
Add or remove scopes in user profiles.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:access:write` (or) role = `super_admin`

#### Before You Start

Read more about access control [here](/Understanding-Access-Control-and-Integrating-with-Other-Microservices).

#### URL

**POST /user/admin-api/access**

#### Request Body

| Parameter  | Type                      | Description                                                                                                                            | Required / Optional |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| targets    | array                     | Array of user IDs.                                                                                                                     | Required            |
| targetType | enum(`user`, `client`)    | Type of target.                                                                                                                        | Required            |
| scope      | array                     | Array of scope names. See full list [here](https://github.com/shrihari-prakash/liquid/blob/main/src/service/scope-manager/scopes.json) | Required            |
| operation  | enum(`set`, `add`, `del`) | Specifies the type of modification.                                                                                                    | Required            |

#### Request Sample (JSON)

```json
{
  "targets": ["507f1f77bcf86cd799439011"],
  "targetType": "user",
  "scope": ["admin:profile:read", "admin:profile:write"],
  "operation": "set"
}
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Create Users
<br/>
Creates users using a given array of user details.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:create:write`

#### URL

**POST /user/admin-api/create**

#### Request Body (Array Skeleton)

| Parameter        | Type   | Description                                                                                          | Required / Optional |
| ---------------- | ------ | ---------------------------------------------------------------------------------------------------- | ------------------- |
| username         | string | Username for the user. Contains text, numbers and \_ and at least 8 letters                          | Required            |
| firstName        | string | First name of the user.                                                                              | Required            |
| lastName         | string | Last name of the user.                                                                               | Required            |
| email            | string | Email address of the user.                                                                           | Required            |
| password         | string | Password for the user.                                                                               | Required            |
| role             | string | Role of the user. Target role be ranked less than the user calling the API or must be a super admin. | Optional            |
| phoneCountryCode | string | Valid country code.                                                                                  | Optional            |
| phone            | string | Phone number of the user.                                                                            | Optional            |

#### Request Sample (JSON)

```json
[
  {
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "phoneCountryCode": "+00",
    "phone": "0000000000",
    "email": "user@example.com",
    "password": "$uper&ecurePassw0rd"
  }
]
```

#### Response Parameters

| Parameter     | Type    | Description              |
| ------------- | ------- | ------------------------ |
| ok            | integer | 0 or 1                   |
| insertedCount | integer | Number of users created. |

#### Response Sample

```json
{
  "ok": 1,
  "insertedCount": 1
}
```

</details>

<details>
<summary>
### Create Application
<br/>
Creates an application client.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

* `admin:system:internal-client:write`
* `admin:system:external-client:write`

#### URL

**POST /client/admin-api/create**

#### Request Body (Array Skeleton)

| Parameter    | Type                                                                         | Description                              | Required / Optional |
| ------------ | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------- |
| id           | string                                                                       | ID of the client.                        | Required            |
| grants       | array[enum(client_credentials, authorization_code, refresh_token, password)] | Grants allowed for the client            | Required            |
| redirectUris | array                                                                        | Redirect URIs authorized for the client. | Required            |
| secret       | string                                                                       | The client secret.                       | Required            |
| role         | enum(internal_client, external_client)                                       | Role of the client.                      | Required            |
| scope        | array                                                                        | Array of scope                           | Required            |
| displayName  | string                                                                       | Display name of the client.              | Required            |

#### Request Sample (JSON)

```json
[
  {
    "id": "external_client",
    "grants": ["client_credentials"],
    "redirectUris": ["https://redirect.uri"],
    "secret": "super-secure-client-secret",
    "role": "external_client",
    "scope": ["client:profile:read", "client:social:all"],
    "displayName": "My External Client"
  }
]
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Update Application
<br/>
Updates an application client.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

* `admin:system:internal-client:write`
* `admin:system:external-client:write`

#### URL

**PATCH /client/admin-api/update**

#### Request Body

| Parameter    | Type                                                                         | Description                              | Required / Optional |
| ------------ | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------- |
| target       | string                                                                       | DBID of the client.                      | Required            |
| id           | string                                                                       | ID of the client.                        | Required            |
| grants       | array[enum(client_credentials, authorization_code, refresh_token, password)] | Grants allowed for the client            | Required            |
| redirectUris | array                                                                        | Redirect URIs authorized for the client. | Required            |
| secret       | string                                                                       | The client secret.                       | Required            |
| role         | enum(internal_client, external_client)                                       | Role of the client.                      | Required            |
| scope        | array                                                                        | Array of scope                           | Required            |
| displayName  | string                                                                       | Display name of the client.              | Required            |

#### Request Sample (JSON)

```json
{
  "target: "507f1f77bcf86cd799439011"
  "id": "external_client",
  "grants": ["client_credentials"],
  "redirectUris": ["https://redirect.uri"],
  "secret": "super-secure-client-secret",
  "role": "external_client",
  "scope": ["client:profile:read", "client:social:all"],
  "displayName": "My External Client"
}
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Delete Application
<br/>
Deletes an application client.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

* `admin:system:internal-client:delete`
* `admin:system:external-client:delete`

#### URL

**DELETE /client/admin-api/delete**

#### Request Body

| Parameter    | Type                                                                         | Description                              | Required / Optional |
| ------------ | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------- |
| target       | string                                                                       | DBID of the client.                      | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### List Applications
<br/>
List applications/clients in the system.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:system:client:read`

#### URL

**GET /client/admin-api/list**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page                                 | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter    | Type  | Description            |
| ------------ | ----- | ---------------------- |
| applications | array | Array of applications. |

#### Response Sample

```json
{
  "ok": 1,
  "data": [
    {
      "id": "external_client",
      "grants": ["client_credentials"],
      "redirectUris": ["https://redirect.uri"],
      "secret": "super-secure-client-secret",
      "role": "external_client",
      "scope": ["client:profile:read", "client:social:all"],
      "displayName": "My External Client"
    }
  ]
}
```

</details>

<details>
<summary>
### List Users
<br/>
List users in the system.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:read`

#### URL

**GET /user/admin-api/list**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page                                 | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter | Type  | Description     |
| --------- | ----- | --------------- |
| users     | array | Array of users. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "middleName": null,
        "lastName": "Doe",
        "gender": "male",
        "username": "john_doe",
        "role": "user",
        "bio": "Grab a straw, because you suck.",
        "designation": "Software Engineer",
        "profilePictureUrl": "https://image.com/url",
        "pronouns": "he/him",
        "verified": true,
        "verifiedDate": "2023-09-09T13:45:52.505Z",
        "customLink": "https://custom.link",
        "followingCount": 250,
        "followerCount": 1058,
        "isPrivate": true,
        "isSubscribed": true,
        "subscriptionTier": "basic",
        "subscriptionExpiry": "2023-09-09T13:45:52.505Z",
        "isBanned": false,
        "isRestricted": false,
        "email": "john.doe@example.com",
        "phone": "0000000000",
        "customData": {}
      }
    ]
  }
}
```

</details>

<details>
<summary>
### Get User Info
<br/>
Get information about a user from their ID.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:read`

#### URL

**GET /user/admin-api/user-info**

#### Query Parameters

| Parameter | Type   | Description                      | Required / Optional |
| --------- | ------ | -------------------------------- | ------------------- |
| targets   | string | Comma separated list of user IDs | Required            |

#### Response Data Parameters

| Parameter | Type  | Description     |
| --------- | ----- | --------------- |
| users     | array | Array of users. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "middleName": null,
        "lastName": "Doe",
        "gender": "male",
        "username": "john_doe",
        "role": "user",
        "bio": "Grab a straw, because you suck.",
        "designation": "Software Engineer",
        "profilePictureUrl": "https://image.com/url",
        "pronouns": "he/him",
        "verified": true,
        "verifiedDate": "2023-09-09T13:45:52.505Z",
        "customLink": "https://custom.link",
        "followingCount": 250,
        "followerCount": 1058,
        "isPrivate": true,
        "isSubscribed": true,
        "subscriptionTier": "basic",
        "subscriptionExpiry": "2023-09-09T13:45:52.505Z",
        "isBanned": false,
        "isRestricted": false,
        "email": "john.doe@example.com",
        "phone": "0000000000",
        "customData": {}
      }
    ]
  }
}
```

</details>

<details>
<summary>
### Update User Info
<br/>
Updates a user's profile details.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

- `admin:profile:write`
- `admin:profile:sensitive:extreme:write`
- `admin:profile:sensitive:high:write`
- `admin:profile:sensitive:medium:write`
- `admin:profile:sensitive:low:write`

#### Before You Start

Read about editing users [here](/fields-and-attributes/All-Fields#updating-fields)

#### URL

**PATCH /user/admin-api/update**

#### Request Body

| Parameter        | Type   | Description                                                                 | Required / Optional |
| ---------------- | ------ | --------------------------------------------------------------------------- | ------------------- |
| target           | string | `_id` of the user.                                                          | Optional            |
| username         | string | Username for the user. Contains text, numbers and \_ and at least 8 letters | Optional            |
| firstName        | string | First name of the user.                                                     | Optional            |
| lastName         | string | Last name of the user.                                                      | Optional            |
| email            | string | Email address of the user.                                                  | Optional            |
| password         | string | Password for the user.                                                      | Optional            |
| role             | string | Role of the user.                                                           | Optional            |
| phoneCountryCode | string | Valid country code.                                                         | Optional            |
| phone            | string | Phone number of the user.                                                   | Optional            |

#### Request Sample (JSON)

```json
[
  {
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "phoneCountryCode": "+00",
    "phone": "0000000000",
    "email": "user@example.com",
    "password": "$uper&ecurePassw0rd"
  }
]
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Update User Custom Data
<br/>
Updates a user's custom data.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:custom-data:write`

#### Before You Start

Read about custom data [here](/fields-and-attributes/Custom-Data)

#### URL

**PUT /user/admin-api/custom-data**

#### Request Body

| Parameter        | Type   | Description                                                                 | Required / Optional |
| ---------------- | ------ | --------------------------------------------------------------------------- | ------------------- |
| target           | string | `_id` of the user.                                                          | Required            |
| customData       | object | JSON data object                                                            | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011",
  "customData": {
    "themePreference": "dark",
    "nestedKey": {
      "integer": 1
    }
  }
}
```

#### Response Parameters

| Parameter | Type    | Description |
| --------- | ------- | ----------- |
| ok        | integer | 0 or 1      |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Get Editable Fields
<br/>
Get the field names you can edit while using **PATCH /user/admin-api/user**.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:configuration:read`

#### URL

**POST /user/admin-api/create**

#### Request Body

| Parameter      | Type  | Description                                            |
| -------------- | ----- | ------------------------------------------------------ |
| editableFields | array | Array of fields that are editable by the current user. |

#### Response Sample

```json
{
  "data": {
    "editableFields": ["string"]
  }
}
```

</details>

<details>
<summary>
### Ban User
<br/>
Suspend a user from logging into Liquid.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:ban:write`

#### URL

**POST /user/admin-api/ban**

#### Request Body

| Parameter | Type    | Description                                 |
| --------- | ------- | ------------------------------------------- |
| target    | array   | `_id` of the user to be banned or unbanned. |
| state     | boolean | Ban status.                                 |

#### Request Sample

```json
{
  "target": "507f1f77bcf86cd799439011",
  "state": true
}
```

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Restrict User
<br/>
Marks a user as restricted.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:restrict:write`

#### URL

**POST /user/admin-api/restrict**

#### Request Body

| Parameter | Type    | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| target    | array   | `_id` of the user to be restricted or unrestricted. |
| state     | boolean | Ban status.                                         |

#### Request Sample

```json
{
  "target": "507f1f77bcf86cd799439011",
  "state": true
}
```

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Verify User
<br/>
Marks a user as verified.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:verifications:write`

#### URL

**POST /user/admin-api/verify**

#### Request Body

| Parameter | Type    | Description                                     |
| --------- | ------- | ----------------------------------------------- |
| target    | array   | `_id` of the user to be verified or unverified. |
| state     | boolean | Ban status.                                     |

#### Request Sample

```json
{
  "target": "507f1f77bcf86cd799439011",
  "state": true
}
```

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Update User Credits
<br/>
Update credits of a user. Credits are usually similar to virtual money that you can use for controlling paid features. You can also use this as a reward points system.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:credits:write`

#### Special Instructions

- Adjust the number of credits that a user has while signing up using the option `user.account-creation.initial-credit-count`.

#### URL

**POST /user/admin-api/credits**

#### Request Body

| Parameter | Type                                  | Description                                     |
| --------- | ------------------------------------- | ----------------------------------------------- |
| target    | array                                 | `_id` of the user to be verified or unverified. |
| operation | enum(`increment`, `decrement`, `set`) | Operation to be performed on the credit value.  |

#### Request Sample

```json
{
  "target": "6291396efe7079829e49b723",
  "operation": "increment",
  "value": 50
}
```

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Get Invite Codes
<br/>
Retrieves invite codes for a user.
</summary>

#### Authentication

Requires a delegated authentication

#### Scope

`admin:social:invite-code:read`

#### URL

**GET /user/admin-api/invite-codes**

#### Before You Start

Read more about the Invite-Only system [here](/features/Invite-Only-Mode).

#### Query Parameters

| Parameter | Type  | Description                                                                                          |
| --------- | ----- | ---------------------------------------------------------------------------------------------------- |
| target    | array | Array of invite codes. Absence of `targetId` parameter in objects means the invite code is not used. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "inviteCodes": [
      {
        "code": "GU-2526-1687389089010",
        "createdAt": "2023-06-21T16:31:29.012Z",
        "updatedAt": "2023-09-06T15:07:42.794Z",
        "targetId": "64f895bec011931326757de6"
      },
      {
        "code": "IE-2949-1687895089010",
        "createdAt": "2023-06-21T16:31:29.012Z",
        "updatedAt": "2023-06-21T16:31:29.012Z"
      },
      {
        "code": "RN-9486-1687365089009",
        "createdAt": "2023-06-21T16:31:29.012Z",
        "updatedAt": "2023-06-22T16:48:48.622Z"
      },
      {
        "code": "AX-4751-1687286989010",
        "createdAt": "2023-06-21T16:31:29.012Z",
        "updatedAt": "2023-06-21T16:31:29.012Z"
      },
      {
        "code": "PJ-5631-1689673089010",
        "createdAt": "2023-06-21T16:31:29.012Z",
        "updatedAt": "2023-06-21T16:31:29.012Z"
      }
    ]
  }
}
```

</details>
