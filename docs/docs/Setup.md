---
title: Setup
---

## Before you start

There are a few dependencies for Liquid to run as intented.

First of all, you need **MongoDB** and **Redis** instances running. Redis is not absolutely required, but it is highly recommended that you have it. You can disable Redis by disabling the option `privilege.can-use-cache`, but again, it is not recommended.

Secondly, you need a **SendGrid** account, because this is how Liquid sends emails to verify user accounts and reset account passwords. If you do not have a SendGrid account right away, you can disable SendGrid usage by disabling the following options: `user.account-creation.require-email-verification` (backend & frontend), `privilege.can-reset-password` (frontend). As you might have noticed, this will bypass email verifications when users are signing up and will also disable the forgot password button. Disabling these can be useful for development purposes.

## Full list of dependencies

Almost everything is **optional** except MongoDB.

| Dependency                  | Optional | Used by Default | Related Options                                                                                                             | Disable Recommended? |
| --------------------------- | -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| MongoDB                     | No       | Yes             | mongo-db.connection-string                                                                                                  | No                   |
| Redis                       | Yes      | Yes             | privilege.can-use-cache, redis.\*                                                                                           | No                   |
| SendGrid                    | Yes      | Yes             | user.account-creation.require-email-verification (backend & frontend), privilege.can-reset-password (frontend), sendgrid.\* | No                   |
| AWS S3 (or) S3 like storage | Yes      | No              | privilege.can-use-profile-picture-apis, s3.\*                                                                               | Yes                  |
| RabbitMQ                    | Yes      | No              | privilege.can-use-push-events, privilege.can-use-rabbitmq, rabbitmq.\*                                                      | Yes                  |

## The basics

There are a few configuration files required for liquid to function:

1. **app-config.json**: The frontend configuration file. This controls everything that the user sees in pages like login, signup, etc. Heavily used for cosmetic changes, but also controls enabling and disabling certain features shown in forms.
2. **.env**: The backend configuration file. This is the file where all your important liquid configurations and secrets are stored. Like MongoDB URL, Redis credentials, what features to enable in the system, etc.
3. **scope-extensions.json**: The scopes file (Optional). OAuth systems usually determine if a user is allowed to access an API by checking if they have access to the scope associated with the API. More about this later.

:::note

Changing Backend options (`app-config.service.json` / `.env` file passed to Liquid) requires a restart of the service. Changing Frontend options instantly reflect when you refresh static pages.

:::

## Editing Liquid configurations

### Backend

All the available backend options are listed in [this file](https://github.com/shrihari-prakash/liquid/blob/main/src/service/configuration/options.json).

To configure options, create a file named `app-config.service.json`. Now copy the `name` field of the option you want to configure to the JSON file and set the intended value.

Here's a sample `app-config.service.json` file for a very minimal Liquid setup:

```json
{
  "environment": "development",
  "cookie.secure": true,
  "cors.allowed-origins": ["http://localhost:2001", "https://your.frontend.origin"],
  "mongo-db.connection-string": "mongodb://localhost:27017/liquid",
  "redis.port": 6379,
  "redis.host": "127.0.0.1",
  "redis.db": 0,
  "system.app-name": "Liquid",
  "system.static.app-config-file-path": "/environment/app-config.static.json",
  "privilege.can-reset-password": false,
  "user.account-creation.require-email-verification": false,
  "system.email-adapter": "print",
  "system.rate-limit.light-api-max-limit": 100000000,
  "system.rate-limit.medium-api-max-limit": 100000000,
  "system.rate-limit.heavy-api-max-limit": 100000000,
  "system.rate-limit.extreme-api-max-limit": 100000000,
  "system.demo-mode": true
}

```

### Frontend

All the available options are listed in [this file](https://github.com/shrihari-prakash/liquid/blob/main/src/public/configuration/options.json).

When you want to configure an option, you would copy the `name` field of the option and set it in app-config.static.json.

Here's a sample `app-config.static.json` file:

```json
{
  "oauth.client-id": "application_client",
  "oauth.redirect-uri": "{{your-default-oauth-redirect-uri}}",
  "content.app-name": "My App",
  "content.app-tagline": "My App Tagline."
}
```

## Installation

Now that we have our configuration files ready, let's boot up liquid with them.

1. Pull the docker image by using command `docker pull shrihariprakash/liquid`.
2. Create a collection in your database named `clients` and insert the following document into the collection (Make sure you edit the frontend URIs and secret in the document below):

```json
{
  "id": "application_client",
  "grants": ["client_credentials", "authorization_code", "refresh_token"],
  "redirectUris": [
    "{{frontend-redirect-uri-1}}",
    "{{frontend-redirect-uri-2}}"
  ],
  "secret": "super-secure-client-secret",
  "role": "internal_client",
  "scope": ["*"],
  "displayName": "Application Client"
}
```

3. Update properties `oauth.client-id` and `oauth.redirect-uri` in your `app-config.json` to values from the document you just inserted into `clients` collection. Feel free to explore other options related to UI customizations.
4. Have your backend configurations ready in the file **`.env`** (preferably put it on the same folder as your app-config.json).
5. Now open terminal in the folder that contains your `app-config.json` and `.env`.
6. If you are on Windows, run:

```bash
docker run -p 2000:2000 -v "%cd%":/environment --env "SYSTEM_SERVICE_APP_CONFIG_FILE_PATH=/environment/app-config.service.json" --name liquid -itd shrihariprakash/liquid:latest
```

7. If you are on Linux, run

```bash
docker run -p 2000:2000 -v "$(pwd)":/environment --env "SYSTEM_SERVICE_APP_CONFIG_FILE_PATH=/environment/app-config.service.json" --name liquid -itd shrihariprakash/liquid:latest
```

8. Alternatively, you can use docker compose for easy restarts:

```yaml
version: "3"
services:
  liquid:
    image: shrihariprakash/liquid:latest
    container_name: liquid
    ports:
      - "2000:2000"
    volumes:
      - .:/environment # Replace . with the folder that contains app-config.json and .env
    env_file:
      - .env
```

9. All done ✨, navigating to `host-machine:2000` should render login page. All the APIs are ready to be called from your other services. If the rest of your project is running on Node, you can use the [Liquid Node Connector](https://www.npmjs.com/package/liquid-node-connector) to authenticate users connecting to your service and also to get client tokens to interact with Liquid client APIs. [Click here for Swagger](https://shrihari-prakash.github.io/liquid-docs). Also see Sign Up and Login section in the bottom of this document to find how to handle redirects from your app for authentication.
10. As a general best practice, whenever you launch Liquid, always look for any warnings in the logs. This can help you catch misconfigurations very early before your users notice them.

## First time setup

Now we have our liquid instance running. That's fantastic! There's just one more thing to do. Assign someone as the system administrator. Liquid needs a super admin for the system that can provide access to all other users in the system. To do this, create an account on Liquid by doing the following:

1. Visit `/signup` and fill the details.
2. Click on Create Account.
3. If you have email verifications enabled, a code is sent to your email. Enter this code on the verification page. If you have verifications disabled, you are redirected to the login page. **DO NOT LOGIN YET!**.

Once you sign up for an account, you would need to make yourself super admin by editing the database entry for your account. This is the last time you will touch the database manually. Run the following commands in your MongoDB instance:

```bash
use liquid

db.users.updateOne( { username: "your_username" },
{
  $set: {
    role: "super_admin",
    scope: ["*"]
  }
})
```

This would give you full access to the system. 

### Login

1. To authenticate with liquid, redirect to `/login?redirect={{your_target_uri}}&theme={{light | dark}}` from your app (or you could just visit the login URL) and enter your credentials. Note that the value of redirect parameter must be one of the values configured in `redirectUris` of Setup(2).
2. If the credentials are correct, the application redirects the control to the url specified in `redirect` parameter with the state and authorization code.
3. In your application logic, you can use this code in exchange for an access and refresh token using the `authorization_code` grant.

### To make Liquid production ready, continue to the [Production Guide](/Making-Liquid-Production-Ready)

Get started with the APIs [here](/api-documentation/API-Documentation-OAuth-2.0)