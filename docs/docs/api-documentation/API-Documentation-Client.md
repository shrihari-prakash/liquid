---
title: "API-Documentation: Client"
---

# Client APIs

Accessible by `client_credentials` grant. Usually accessed by other microservices in your system.

<details>
<summary>
### Access Provisioning
<br/>
Add or remove scopes in user profiles.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:profile:access:write`

#### Before You Start

Read more about access control [here](/Understanding-Access-Control-and-Integrating-with-Other-Microservices).

#### URL

**POST /user/client-api/access**

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

Requires client authentication.

#### Scope

`client:profile:create:write`

#### URL

**POST /user/client-api/create**

#### Request Body

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
### List Users
<br/>
List users in the system.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:profile:read`

#### URL

**GET /user/client-api/list**

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

Requires client authentication.

#### Scope

`client:profile:read`

#### URL

**POST /user/client-api/retrieve-user-info**

#### Request Body

| Parameter | Type                                  | Description                 | Required / Optional |
| --------- | ------------------------------------- | --------------------------- | ------------------- |
| targets   | string                                | Array of user IDs or emails | Required            |
| field     | boolean (\_id, email, sanitizedEmail) |                             | Optional            |

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

- `client:profile:write`
- `client:profile:sensitive:extreme:write`
- `client:profile:sensitive:high:write`
- `client:profile:sensitive:medium:write`
- `client:profile:sensitive:low:write`

#### Before You Start

Read about editing users [here](/fields-and-attributes/All-Fields#updating-fields)

#### URL

**PATCH /user/client-api/update**

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

`client:profile:custom-data:write`

#### Before You Start

Read about custom data [here](/fields-and-attributes/Custom-Data)

#### URL

**PUT /user/admin-api/custom-data**

#### Request Body

| Parameter  | Type   | Description        | Required / Optional |
| ---------- | ------ | ------------------ | ------------------- |
| target     | string | `_id` of the user. | Required            |
| customData | object | JSON data object   | Required            |

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
### Ban User
<br/>
Suspend a user from logging into Liquid.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:profile:ban:write`

#### URL

**POST /user/client-api/ban**

#### Response Data Parameters

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

Requires client authentication.

#### Scope

`client:profile:restrict:write`

#### URL

**POST /user/client-api/restrict**

#### Response Data Parameters

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
### Update User Credits
<br/>
Update credits of a user. Credits are usually similar to virtual money that you can use for controlling paid features. You can also use this as a reward points system.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:profile:credits:write`

#### Special Instructions

- Adjust the number of credits that a user has while signing up using the option `user.account-creation.initial-credit-count`.

#### URL

**POST /user/client-api/credits**

#### Response Data Parameters

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
### Read Block Status
<br/>
Check if a given source user has blocked the target user.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:social:block:read`

#### URL

**GET /user/client-api/block-status**

#### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| source    | string | `_id` of the source user. |
| target    | string | `_id` of the target user. |

#### Response Data Parameters

| Parameter | Type    | Description                                           |
| --------- | ------- | ----------------------------------------------------- |
| blocked   | boolean | Specifies if the source user blocked the target user. |

#### Response Sample

```json
{
  "data": {
    "blocked": true
  }
}
```

</details>

<details>
<summary>
### Read Follow Status
<br/>
Check if a given source user is following the target user.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:social:follow:read`

#### URL

**GET /user/client-api/follow-status**

#### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| source    | string | `_id` of the source user. |
| target    | string | `_id` of the target user. |

#### Response Data Parameters

| Parameter | Type    | Description                                                |
| --------- | ------- | ---------------------------------------------------------- |
| following | boolean | Specifies if the source user is following the target user. |

#### Response Sample

```json
{
  "data": {
    "following": true
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

Requires client authentication.

#### Scope

`client:social:follow:read`

#### URL

**GET /user/client-api/followers**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| target    | integer | `_id` of the user.                               | Optional            |
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
          "phone": "0000000000"
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

Requires client authentication.

#### Scope

`client:social:follow:read`

#### URL

**GET /user/client-api/following**

#### Query Parameters

| Parameter | Type    | Description                                      | Required / Optional |
| --------- | ------- | ------------------------------------------------ | ------------------- |
| target    | integer | `_id` of the user.                               | Optional            |
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
          "phone": "0000000000"
        }
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

Requires a client authentication

#### Scope

`client:social:invite-code:read`

#### URL

**GET /user/client-api/invite-codes**

#### Before You Start

Read more about the Invite-Only system [here](/features/Invite-Only-Mode).

#### Request Parameters

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

<details>
<summary>
### Subscription Management
<br/>
Manage user subscriptions, tiers, and cancellations.
</summary>

#### Authentication

Requires client authentication.

#### Scope

`client:profile:subscriptions:write`

#### Manage Subscription

##### URL

**POST /user/client-api/subscription**

##### Request Body

| Parameter              | Type              | Description                                | Required / Optional    |
| ---------------------- | ----------------- | ------------------------------------------ | ---------------------- |
| target                 | string            | User ID of the target user                 | Required               |
| state                  | boolean           | Whether the subscription is active         | Required               |
| expiry                 | string (ISO date) | Expiration date for the subscription       | Required if state=true |
| tier                   | string            | The subscription tier (from configuration) | Optional               |
| subscriptionIdentifier | string or number  | External identifier for the subscription   | Optional               |

##### Request Sample

```json
{
  "target": "507f1f77bcf86cd799439011",
  "state": true,
  "expiry": "2026-07-28T00:00:00.000Z",
  "tier": "premium",
  "subscriptionIdentifier": "subscription_12345"
}
```

##### Response Sample

```json
{
  "ok": 1
}
```

#### Cancel Subscription

##### URL

**POST /user/client-api/subscription-cancel**

##### Request Body

| Parameter | Type    | Description                           | Required / Optional |
| --------- | ------- | ------------------------------------- | ------------------- |
| target    | string  | User ID of the target user            | Required            |
| cancelled | boolean | Whether the subscription is cancelled | Required            |

##### Request Sample

```json
{
  "target": "507f1f77bcf86cd799439011",
  "cancelled": true
}
```

##### Response Sample

```json
{
  "ok": 1
}
```

</details>
