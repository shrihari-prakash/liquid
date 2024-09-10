---
title: "API-Documentation: OAuth 2.0"
---

:::info

All standard OAuth APIs use `sake_case` for both request and response parameters to comply with the OAuth 2.0 specifications. The introspect API is specific to Liquid which alone uses `camelCase`.

:::

## Client Authentication

<details>
<summary>
### Access Token
<br/>
Exchange your client ID and secret for an access token.
</summary>

#### Before You Start

You can adjust the validity of the access token by changing the option `oauth.access-token-lifetime` to the intended number of seconds. By default, the validity is 1 hour.

#### URL

**POST /oauth/token**

#### Request Body (Form Data)

| Parameter     | Type   | Description                     | Required / Optional |
| ------------- | ------ | ------------------------------- | ------------------- |
| grant_type    | string | Set to "client_credentials"     | Required            |
| client_id     | string | Your client ID.                 | Required            |
| client_secret | string | Your client secret.             | Required            |
| scope         | string | Comma separated list of scopes. | Required            |

#### Request Sample (JSON)

```json
{
  "grant_type": "client_credentials",
  "client_id": "application_client",
  "client_secret": "super-secure-client-secret",
  "scope": "client:profile:read"
}
```

#### Response Parameters

| Parameter    | Type   | Description                       |
| ------------ | ------ | --------------------------------- |
| access_token | string | The access token.                 |
| token_type   | string | The token type. Usually "Bearer". |
| expires_in   | number | Token expiry in seconds.          |

#### Response Sample

```json
{
  "access_token": "cfb1983f82d187ac26598dca27aa3078236e645ccb18d77bdcba100d62a99231",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

</details>

<details>
<summary>
### Introspect [Non-Standard OAuth]
<br/>
Verify delegated tokens.
</summary>

#### Before You Start

Any other microservice in your application apart from Liquid that need to provide an authentication to the frontend will use this API. For instance, let's say a chat service in your system needs to verify the user is authenticated to access your application. You will call this API with the Liquid access token and it would return the user information after verifying the authenticity of the token. The API also returns the scopes allowed for the token. Using all this information, you can choose to allow or disallow access to your chat API.

For microservices running on node, use the [Liquid Node Connector](https://www.npmjs.com/package/liquid-node-connector). This will already use introspect API under the hood and makes your integration much easier.

For more information, see [Understanding Access Control and Integrating with Other Microservices](/Understanding-Access-Control-and-Integrating-with-Other-Microservices)

#### URL

**POST /oauth/token/introspect**

#### Request Body (Form Data)

| Parameter | Type   | Description                                                                        | Required / Optional |
| --------- | ------ | ---------------------------------------------------------------------------------- | ------------------- |
| token     | string | Token of the user to be authenticated. (Acquired using `authorization code` grant) | Required            |

#### Request Sample (JSON)

```json
{
  "token": "7eb2b49801f4ff3bbce93531dcf559c75504013cc0d7c2d03c49a529dedf4d72"
}
```

#### Response Data Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| tokenInfo | object | Information about the token. |

#### Response Sample

```json
{
  "ok": 1,
  "data": {
    "tokenInfo": {
      "accessToken": "7eb2b49801f4ff3bbce93531dcf559c75504013cc0d7c2d03c49a529dedf4d72",
      "accessTokenExpiresAt": "2023-09-26T18:54:14.821Z",
      "scope": "delegated:all,admin:all",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "firstName": "John",
        "lastName": "Doe",
        "preferredLanguage": "en",
        "role": "user",
        "verified": true,
        "followingCount": 1,
        "followerCount": 0,
        "isPrivate": false,
        "email": "johndoe@example.com",
        "emailVerified": true,
        "isSubscribed": false,
        "credits": 0,
        "isActive": true,
        "isBanned": false,
        "isRestricted": false,
        "deleted": false,
        "createdAt": "2023-06-21T13:20:00.112Z",
        "updatedAt": "2023-09-04T14:52:15.442Z",
        "customLink": "https://custom.link",
        "profilePicturePath": null
      }
    }
  }
}
```

</details>

## Delegated Authentication

<details>
<summary>
### Get Authorization Code
<br/>
Get an authorization code after login.
</summary>

#### Before You Start

- If you're using Liquid's built in login and signup UI, you will never need to access this API. Simply redirect to `/login` with the required params and you'll be redirected back to your application with the authorization code and state if everything goes well.
- You can adjust the validity of the authorization code by changing the option `oauth.authorization-code-lifetime` to the intended number of seconds. By default, the validity is 5 minutes.

#### URL

**POST /oauth/token**

#### Request Body (Form Data)

| Parameter     | Type   | Description                     | Required / Optional |
| ------------- | ------ | ------------------------------- | ------------------- |
| response_type | string | Set to `code`                   | Required            |
| client_id     | string | Your client ID.                 | Required            |
| redirect_uri  | string | An authorized redirect URI.     | Required            |
| state         | string | Application state.              | Required            |
| scope         | string | Comma separated list of scopes. | Required            |

#### Request Sample (JSON)

```json
{
  "response_type": "code",
  "client_id": "application_client",
  "code": "the_code",
  "redirect_uri": "https://my-redirect.uri/path",
  "state": "xxx-yyy-zzz"
  "scope": "delegated:all"
}
```

#### Response

A redirect to your callback URL with `code` and `state` as URL parameters.

</details>

<details>
<summary>
### Access Token (From Authorization Code)
<br/>
Exchange authorization code for an access token.
</summary>

#### Before You Start

- You can adjust the validity of the access token by changing the option `oauth.access-token-lifetime` to the intended number of seconds. By default, the validity is 1 hour.
- You can adjust the validity of the refresh token by changing the option `oauth.refresh-token-lifetime` to the intended number of seconds. By default, the validity is 15 days.

#### URL

**POST /oauth/token**

#### Request Body (Form Data)

| Parameter    | Type   | Description                     | Required / Optional |
| ------------ | ------ | ------------------------------- | ------------------- |
| grant_type   | string | Set to `authorization_code`     | Required            |
| code         | string | Your authorization code         | Required            |
| client_id    | string | Your client ID.                 | Required            |
| redirect_uri | string | An authorized redirect URI.     | Required            |
| scope        | string | Comma separated list of scopes. | Required            |

#### Request Sample (JSON)

```json
{
  "grant_type": "authorization_code",
  "client_id": "application_client",
  "code": "the_code",
  "redirect_uri": "https://my-redirect.uri/path",
  "scope": "delegated:all"
}
```

#### Response Parameters

| Parameter     | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| access_token  | string | The access token.                 |
| token_type    | string | The token type. Usually "Bearer". |
| expires_in    | number | Token expiry in seconds.          |
| refresh_token | string | The refresh token.                |

#### Response Sample

```json
{
  "access_token": "7eb2b49801f4ff3bbce93531dcf559c75504013cc0d7c2d03c49a529dedf4d72",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "95068fcd6ed814ebd14981903c280dce0ff86bc794c1121cc1b10be4fd588c7a"
}
```

</details>

<details>
<summary>
### Access Token (From Refresh Token)
<br/>
Exchange a refresh token to get an access token.
</summary>

#### URL

**POST /oauth/token**

#### Request Body (Form Data)

| Parameter     | Type   | Description             | Required / Optional |
| ------------- | ------ | ----------------------- | ------------------- |
| grant_type    | string | Set to `refresh_token`. | Required            |
| refresh_token | string | The refresh token.      | Required            |
| client_id     | string | Your client ID.         | Required            |

#### Request Sample (JSON)

```json
{
  "grant_type": "refresh_token",
  "client_id": "application_client",
  "refresh_token": "7eb2b49801f4ff3bbce93531dcf559c75504013cc0d7c2d03c49a529dedf4d72"
}
```

#### Response Parameters

| Parameter     | Type   | Description                       |
| ------------- | ------ | --------------------------------- |
| access_token  | string | The access token.                 |
| token_type    | string | The token type. Usually "Bearer". |
| expires_in    | number | Token expiry in seconds.          |
| refresh_token | string | The refresh token.                |

#### Response Sample

```json
{
  "access_token": "7eb2b49801f4ff3bbce93531dcf559c75504013cc0d7c2d03c49a529dedf4d72",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "95068fcd6ed814ebd14981903c280dce0ff86bc794c1121cc1b10be4fd588c7a"
}
```

</details>
