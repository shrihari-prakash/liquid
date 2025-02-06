---
title: "API-Documentation: Delegated"
---

# Delegated / General Use APIs

Usually accessible by `authorization_code` grant. Users typically have permissions to access all these APIs at the time of account creation. All API calls are made on behalf of the user associated with the token.

<details>
<summary>
### Create User
<br/>
Creates a user.
</summary>

#### Authentication

No Authentication

#### Scope

NA

#### Special Instructions

After account creation, a code is sent to the user's email which should be exchanged again in POST /user/verify-email to activate the account. APIs are accessible only after account activation. If `user.account-creation.require-email-verification` is false, accounts are automatically marked as email verified while being created.

#### URL

**POST /user/create**

#### Request Body

| Parameter        | Type   | Description                                                                 | Required / Optional |
| ---------------- | ------ | --------------------------------------------------------------------------- | ------------------- |
| username         | string | Username for the user. Contains text, numbers and \_ and at least 8 letters | Required            |
| firstName        | string | First name of the user.                                                     | Required            |
| lastName         | string | Last name of the user.                                                      | Required            |
| email            | string | Email address of the user.                                                  | Required            |
| password         | string | Password for the user.                                                      | Required            |
| phoneCountryCode | string | Valid country code.                                                         | Optional            |
| phone            | string | Phone number of the user.                                                   | Optional            |

#### Request Sample (JSON)

```json
{
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneCountryCode": "+00",
  "phone": "0000000000",
  "email": "user@example.com",
  "password": "$uper&ecurePassw0rd"
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
### Verify Email
<br/>
Marks the user's account associated with the auto generated code as a verified.
</summary>

#### Authentication

No Authentication

#### Scope

NA

#### URL

**POST /user/verify-email**

#### Request Body

| Parameter | Type   | Description            | Required / Optional |
| --------- | ------ | ---------------------- | ------------------- |
| code      | string | Code received in email | Required            |

#### Request Sample (JSON)

```json
[
  {
    "code": "xxx-yyy-zzz-111-222-333"
  }
]
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Login
<br/>
Creates a cookie session and returns user details. To be called before calling /oauth/token.
</summary>

#### Authentication

No Authentication

#### Scope

NA

#### URL

**POST /user/login**

#### Request Body

| Parameter | Type   | Description                                                                 | Required / Optional |
| --------- | ------ | --------------------------------------------------------------------------- | ------------------- |
| username  | string | Username for the user. Contains text, numbers and \_ and at least 8 letters | Required            |
| email     | string | Email address of the user.                                                  | Required            |
| password  | string | Password for the user.                                                      | Required            |
| userAgent | string | User Agent of the browser.                                                  | Required            |

#### Request Sample (JSON)

```json
{
  "username": "john_doe",
  "email": "user@example.com",
  "password": "$uper&ecurePassw0rd",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
}
```

#### Response Data Parameters

| Parameter   | Type   | Description                                     |
| ----------- | ------ | ----------------------------------------------- |
| userInfo    | object | The user details                                |
| 2faEnabled  | object | Specifies if 2FA is enabled for the user        |
| sessionHash | object | Unqiue ID for the session to be sent in /do-2fa |

#### Response Sample - Without 2FA

```json
{
  "ok": 1,
  "data": {
    "2faEnabled": false,
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "middleName": null,
      "lastName": "Doe",
      "gender": "male",
      "username": "john_doe",
      "role": "user",
      "bio": "Grab a straw, because you suck.",
      "designation": "Software Engineer",
      "profilePictureUrl": "https://profile.picture/url",
      "pronouns": "he/him",
      "verified": true,
      "varifiedDate": "2023-09-12T15:50:58.690Z",
      "customLink": "https://custom.link",
      "followingCount": 0,
      "followerCount": 0,
      "isPrivate": true,
      "isSubscribed": true,
      "subscriptionTier": "string",
      "subscriptionExpiry": "2023-09-12T15:50:58.691Z",
      "isBanned": true,
      "isRestricted": true,
      "email": "john_doe@example.com",
      "phone": "string",
      "customData": {}
    }
  }
}
```

#### Response Sample - With 2FA

```json
{
  "ok": 1,
  "data": {
    "2faEnabled": true,
    "sessionHash": "0f4e1ea6-9f2f-4239-96ec-64cbfc7e4815",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john_doe@example.com"
    }
  }
}
```

</details>

<details>
<summary>
### Do 2FA
<br/>
Complete Two-Factor authentication for a user after `/login`.
</summary>

#### Authentication

No Authentication

#### URL

**POST /user/do-2fa**

#### Request Body

| Parameter   | Type   | Description                                      | Required / Optional |
| ----------- | ------ | ------------------------------------------------ | ------------------- |
| target      | string | ID of the user for whom 2FA has to be completed. | Required            |
| code        | string | 2FA code.                                        | Required            |
| sessionHash | string | Unique code for the login from /login API.       | Required            |

#### Request Sample (JSON)

```json
[
  {
    "target": "507f1f77bcf86cd799439011",
    "code": 22625
  }
]
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "middleName": null,
      "lastName": "Doe",
      "gender": "male",
      "username": "john_doe",
      "role": "user",
      "bio": "Grab a straw, because you suck.",
      "designation": "Software Engineer",
      "profilePictureUrl": "https://profile.picture/url",
      "pronouns": "he/him",
      "verified": true,
      "varifiedDate": "2023-09-12T15:50:58.690Z",
      "customLink": "https://custom.link",
      "followingCount": 0,
      "followerCount": 0,
      "isPrivate": true,
      "isSubscribed": true,
      "subscriptionTier": "string",
      "subscriptionExpiry": "2023-09-12T15:50:58.691Z",
      "isBanned": true,
      "isRestricted": true,
      "email": "john_doe@example.com",
      "phone": "string",
      "customData": {}
    }
  }
}
```

</details>

<details>
<summary>
### Enable 2FA
<br/>
Enable Two-Factor authentication for the user.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:profile:2fa:write`

#### URL

**POST /user/2fa**

#### Request Body

| Parameter | Type    | Description | Required / Optional |
| --------- | ------- | ----------- | ------------------- |
| state     | boolean | 2FA status. | Required            |

#### Request Sample (JSON)

```json
[
  {
    "state": true
  }
]
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Logout
<br/>
Logs out the current user.
</summary>

#### Authentication

Requires a delegated authentication

#### Scope

NA

#### URL

**GET /user/logout**

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
### Logout All
<br/>
Logs out all sessions and invalidates all access and refresh tokens of the current user.
</summary>

#### Authentication

Requires a delegated authentication

#### Scope

NA

#### URL

**GET /user/logout-all**

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
### Generate Password Reset Code
<br/>
Generate code to initiate a password reset.
</summary>

#### Authentication

No Authentication

#### Scope

NA

#### Special Instructions

A code is sent to the email sent in the request which should be exchanged to reset password.

#### URL

**GET /user/code**

#### Query Parameters

| Parameter | Type   | Description       | Required / Optional |
| --------- | ------ | ----------------- | ------------------- |
| email     | string | Email of the user | Required            |

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Reset Password
<br/>
Change the password of the user who initiated password reset in GET /user/code.
</summary>

#### Authentication

Requires code from email

#### Scope

NA

#### URL

**POST /user/reset-password**

#### Request Body

| Parameter | Type   | Description            | Required / Optional |
| --------- | ------ | ---------------------- | ------------------- |
| code      | string | Code received in email | Required            |
| password  | string | New password           | Required            |

#### Request Sample (JSON)

```json
[
  {
    "code": "xxx-yyy-zzz-111-222-333",
    "password": "new_Passw0rd"
  }
]
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Switch to Private Account
<br/>
Mark a user's account as private or public.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:profile:write`

#### URL

**POST /user/private**

#### Request Body

| Parameter | Type    | Description     | Required / Optional |
| --------- | ------- | --------------- | ------------------- |
| state     | boolean | Private status. | Required            |

#### Request Sample (JSON)

```json
[
  {
    "state": true
  }
]
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Get Current User Details
<br/>
Get information about the current user.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:profile:read`

#### URL

**GET /user/me**

#### Response Data Parameters

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| user      | object | User information object. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "user": [
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
Updates the user's profile details.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`admin:profile:write`

#### Before You Start

Adjust the editable fields for the system using option `user.profile.editable-fields`.

#### URL

**PATCH /user/me**

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
### Get User Details by ID
<br/>
Get information about a user.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:profile:read`

#### URL

**GET /user/:userId**

#### Response Data Parameters

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| user      | object | User information object. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "user": [
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
### Get Invite Codes
<br/>
Retrieves invite codes for a user.
</summary>

#### Authentication

Requires a delegated authentication

#### Scope

`delegated:social:invite-code:read`

#### URL

**GET /user/invite-codes**

#### Before You Start

Read more about the Invite-Only system [here](/features/Invite-Only-Mode).

#### Response Data Parameters

| Parameter   | Type  | Description                                                                                          |
| ----------- | ----- | ---------------------------------------------------------------------------------------------------- |
| inviteCodes | array | Array of invite codes. Absence of `targetId` parameter in objects means the invite code is not used. |

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

<details>
<summary>
### Search Users
<br/>
Returns a list of users for a search query
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:profile:search`

#### URL

**POST /user/search**

#### Request Body

| Parameter | Type   | Description   | Required / Optional |
| --------- | ------ | ------------- | ------------------- |
| query     | string | Search query. | Required            |

#### Request Sample (JSON)

```json
{
  "query": "rick"
}
```

#### Response Data Parameters

| Parameter | Type  | Description     |
| --------- | ----- | --------------- |
| results   | array | Array of users. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "results": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "source": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### Block
<br/>
Block a user
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:block:write`

#### URL

**POST /user/block**

#### Request Body

| Parameter | Type   | Description                   | Required / Optional |
| --------- | ------ | ----------------------------- | ------------------- |
| target    | string | ID of the user to be blocked. | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Unblock
<br/>
Unblock a user
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:block:write`

#### URL

**POST /user/unblock**

#### Request Body

| Parameter | Type   | Description                   | Required / Optional |
| --------- | ------ | ----------------------------- | ------------------- |
| target    | string | ID of the user to be blocked. | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Follow
<br/>
Follow a user
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:follow:write`

#### URL

**POST /user/follow**

#### Request Body

| Parameter | Type   | Description                    | Required / Optional |
| --------- | ------ | ------------------------------ | ------------------- |
| target    | string | ID of the user to be followed. | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Unfollow
<br/>
Unfollow a user
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:follow:write`

#### URL

**POST /user/unfollow**

#### Request Body

| Parameter | Type   | Description                      | Required / Optional |
| --------- | ------ | -------------------------------- | ------------------- |
| target    | string | ID of the user to be unfollowed. | Required            |

#### Request Sample (JSON)

```json
{
  "target": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### My Followers
<br/>
Get followers of the current user.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:social:follow:read`

#### URL

**GET /user/followers**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page.                                | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter | Type  | Description                |
| --------- | ----- | -------------------------- |
| records   | array | Array of follower records. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "records": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "source": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### My Follow Requests
<br/>
Get the list of users that have requested to follow the current user.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:social:follow:read`

#### URL

**GET /user/follow-requests**

#### Response Data Parameters

| Parameter | Type  | Description                      |
| --------- | ----- | -------------------------------- |
| records   | array | Array of follow request records. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "records": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "source": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### Accept Follow Request
<br/>
Accept a follow request by ID.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:follow:write`

#### URL

**PATCH /user/follow-request**

#### Request Body

| Parameter | Type   | Description             | Required / Optional |
| --------- | ------ | ----------------------- | ------------------- |
| request   | string | ID of the follow entry. | Required            |

#### Request Sample (JSON)

```json
{
  "request": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### My Following
<br/>
Get the list of users that the current user is following.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:social:follow:read`

#### URL

**GET /user/following**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page.                                | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter | Type  | Description     |
| --------- | ----- | --------------- |
| records   | array | Array of users. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "records": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "target": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### User Followers
<br/>
Get followers of a user.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:social:follow:read`

#### URL

**GET /user/:userId/followers**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page.                                | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter | Type  | Description                |
| --------- | ----- | -------------------------- |
| records   | array | Array of follower records. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "records": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "source": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### User Following
<br/>
Get the list of users that a user is following.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:social:follow:read`

#### URL

**GET /user/:userId/following**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| limit     | integer | Records per page.                                | Optional            |
| offset    | integer | `_id` field of last record in the previous page. | Optional            |

#### Response Data Parameters

| Parameter | Type  | Description     |
| --------- | ----- | --------------- |
| records   | array | Array of users. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "records": [
      {
        "_id": "507f191e810c19729de860ea",
        "approved": true,
        "target": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "Rick",
          "middleName": null,
          "lastName": "Asthley",
          "gender": "male",
          "username": "rick_asthley",
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
          "email": "rick_asthley@example.com",
          "phone": "0000000000",
          "customData": {}
        }
      }
    ]
  }
}
```

</details>

<details>
<summary>
### Delete Follower/Following
<br/>
Delete a follow entry by ID.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:social:follow:write`

#### URL

**DELETE /user/follow-entry**

#### Request Body

| Parameter | Type   | Description             | Required / Optional |
| --------- | ------ | ----------------------- | ------------------- |
| entry     | string | ID of the follow entry. | Required            |

#### Request Sample (JSON)

```json
{
  "entry": "507f1f77bcf86cd799439011"
}
```

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### Set Profile Picture
<br/>
Sets profile picture of a user.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:profile:write`

#### Before You Start

Read more about Profile Pictures [here](/features/Profile-Pictures).

#### URL

**PATCH /user/profile-picture**

#### Request Body

| Parameter      | Type | Description | Required / Optional |
| -------------- | ---- | ----------- | ------------------- |
| profilePicture | file | A PNG file. | Required            |

#### Request Sample (JSON)

```json
{
  "profile-picture": /<binary>/
}
```

#### Response Data Parameters

| Parameter | Type   |
| --------- | ------ |
| signedUrl | string |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "signedUrl": "https://profile-picture.url"
  }
}
```

</details>

<details>
<summary>
### Remove Profile Picture
<br/>
Deletes profile picture of a user.
</summary>

#### Authentication

Requires delegated authentication

#### Scope

`delegated:profile:write`

#### URL

**DELETE /user/profile-picture**

#### Request Body

NA

#### Response Parameters

| Parameter | Type    |
| --------- | ------- |
| ok        | boolean |

#### Response Sample

```json
{
  "ok": 1
}
```

</details>

<details>
<summary>
### List Roles
<br/>
Retrieves a list of roles available in the system.
</summary>

#### Authentication

Requires delegated authentication.

#### Scope

`delegated:roles:read`

#### URL

**GET /roles/list**

#### Response Parameters

| Parameter | Type  | Description            |
| --------- | ----- | ---------------------- |
| roles     | array | Array of role objects. |

#### Response Sample

```json
{
  "roles": [
    {
      "id": "role1",
      "displayName": "Role 1",
      "ranking": 1,
      "description": "This is a description"
      "system": true
    },
    {
      "id": "role2",
      "displayName": "Role 2",
      "ranking": 2,
      "description": "This is another description"
      "system": true
    }
  ]
}
```

#### Error Responses

| Error Code    | Description                        |
| ------------- | ---------------------------------- |
| InternalError | An internal server error occurred. |

#### Error Response Sample

**InternalError**

```json
{
  "error": "Internal server error"
}
```

</details>