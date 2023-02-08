# Liquid - Seamless authentication and user APIs for your projects.

An open source TypeScript implementation of [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) based Mongo DB and Redis with user sign up and login✨

When you start new projects, you typically find that you are writing the login, account creation and authentication logic over and over again. This repository provides a plug and play boiler plate code that acts as an authentication and user management server for your other microservices.

In addition to OAuth, the service provides additional (but usually very needed) functionalities for user accounts management.

![Login](images/screenshot-1.png)

You will require Redis to run this service. This is because the service needs to store access and refresh tokens. If you don't want a Redis dep, it is possible force the service into using MongoDB as a replacement by changing the options `privilege.can-use-cache` and `privilege.can-use-cache-for-token` to false. However, disabling this option is highly discouraged since tokens that are not revoked permanently stick to the database.

### Setup

1. Run `npm i`.
2. Copy and rename file `src/public/app-config.sample.json` to `config.json` and replace with your strings.
3. A large part of the service is configurable. You can find the configurable options in file [src/service/configuration/options.json](src/service/configuration/options.json). Parameters like MongoDB connection string and Redis connection settings can be changed. Simply copy the envName of the option youd like to set and put it in your `.env` with your intended value.
4. Create the following client document in the `clients` colelction:

```
{
  "_id": {
    "$oid": "633972976aaa0ba6952f86db"
  },
  "id": "application_client",
  "grants": [
    "client_credentials",
    "authorization_code",
    "refresh_token"
  ],
  "redirectUris": [
    "{{frontend_uri_1}}",
    "{{frontend_uri_2}}"
  ],
  "secret": "your_secret",
  "role": "INTERNAL_CLIENT"
}
```

1. Start the server using command `npm run start:dev` (Or better yet, press the debug button if you are on VS Code). Your service should be running on http://localhost:2000.
2. Run `npm run build` to output production ready code.

### API Documentation:

In development environment, swagger is available at http://localhost:2000/docs. This has the documentation for all the additional functionalities that the service offers apart from OAuth. For OAuth itself, any regular OAuth documentation should work with this. OAuth related functionalities are available at `/oauth`.

### Sign Up:

1. To create an account, visit `/signup` and fill the details.
2. Click on Create Account.
3. If you are running this on dev mode, a code is printed in your console. Enter this code on the verification page.

### Login:

1. To authenticate, redirect to `/login?redirect={{your_target_uri}}&theme={{light | dark}}` and enter your credentials. Note that the value of redirect parameter must be one of the values configured in `redirectUris` of Setup(2).
2. If the credentials are correct, the application redirects the control to the url specified in `redirect` parameter with the state and authorization code.
3. In your application logic, you can use this code in exchange for an access and refresh token using the `authorization_code` grant.
