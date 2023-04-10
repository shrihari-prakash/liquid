# Liquid - Seamless and highly customizable authentication and user APIs for your projects.

An open source TypeScript implementation of [oauthjs/node-oauth2-server](https://github.com/oauthjs/node-oauth2-server) based Mongo DB and Redis with user sign up and login✨

![GitHub](https://img.shields.io/github/license/shrihari-prakash/liquid)
[![Docker Image CI](https://github.com/shrihari-prakash/liquid/actions/workflows/docker-image.yml/badge.svg)](https://github.com/shrihari-prakash/liquid/actions/workflows/docker-image.yml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/shrihari-prakash/liquid)
![GitHub last commit](https://img.shields.io/github/last-commit/shrihari-prakash/liquid)
![Lines of code](https://img.shields.io/tokei/lines/github/shrihari-prakash/liquid)
![GitHub Repo stars](https://img.shields.io/github/stars/shrihari-prakash/liquid?style=social)

When you start new projects, you typically find that you are writing the login, account creation and authentication logic over and over again. This repository provides a plug and play boiler plate code that acts as an authentication and user management server for your other microservices.

![Liquid](images/liquid-banner.png)

### Features

In addition to OAuth, the service provides additional (but usually very needed) features:

⭐ High degree customization capabilities. Customize and configure every part of the UI and service.

⭐ Out of the box support for user sign up and login.

⭐ Includes follow and unfollow mechanisms with support for private accounts.

⭐ Support for admin level and client APIs.

⭐ Quick setup.

> **_NOTE:_** You will require Redis to run this service. This is because the service needs to store access and refresh tokens with an auto expiry. If you don't want a Redis dep, it is possible force the service into using MongoDB as a replacement by changing the option `privilege.can-use-cache` to false. However, disabling this option is highly discouraged since tokens that are not revoked permanently stick to the database. Then it's upto you to write your own CRON to clean them.

## Setup
### Production Usage
The following steps assume you have **Redis** and **MongoDB** installed on your host machine.
1. Pull the docker image by using command `docker pull shrihariprakash/liquid:latest`.
2. Create a collection in your database named `clients` and insert the following document into the collection (Make sure you edit the frontend URIs and secret in the document below):

```
{
  id: "application_client",
  grants: [
    "client_credentials",
    "authorization_code",
    "refresh_token"
  ],
  redirectUris: ["frontend-redirect-uri-1", "frontend-redirect-uri-2", ...],
  secret: "super-secure-client-secret",
  role: "internal_client",
  displayName: "Application Client"
}
```

3. In your host machine, create a file called `app-config.json` with the contents of [this file](https://raw.githubusercontent.com/shrihari-prakash/liquid/main/src/public/app-config.sample.json) and edit properties `oauth -> clientId` and `oauth -> redirectUri` to values from the document you just inserted into clients collection. This is the configuration file used for all your frontend stuff like UI customizations.
5. Now go to [Liquid Option Manager](https://liquid-om.netlify.app/) and edit your backend configurations. For the most minimal setup, you will need to set:
   * `system.static.app-config-absolute-path` to `/environment/app-config.json`
   * `mongo-db.connection-string`
   * `sendgrid.api-key`
   * `sendgrid.outbound-email-address`
   * and options starting with `redis`. 
> **_NOTE:_** A sendgrid account API key is required to send verification emails. If you do not want to verify emails when users are signing up, you can turn it off by turning off option `user.require-email-verification` in .env and `general -> requireEmailVerification` in app-config.json.
7. Export the configuration and **save the file as `.env`** (preferrably put it on the same folder as your app-config.json).
8. Now open terminal in the folder that contains your app-config.json.
9. If you are on Windows, run `docker run -p 2000:2000 -v "%cd%":/environment --env-file .env --name liquid -itd shrihariprakash/liquid:latest`. If you are on Linux, run `docker run -p 2000:2000 -v "$(pwd)":/environment --env-file .env --name liquid -itd shrihariprakash/liquid:latest`
10. All done ✨, navigating to `host-machine:2000` should render login page. All the APIs are ready to be called from your other services. [Click here for Swagger](https://raw.githubusercontent.com/shrihari-prakash/liquid/main/src/swagger.yaml). Checkout the other options in [Option Manager](https://liquid-om.netlify.app/) to enable optional features if they interest you. Also see Sign Up and Login section in the bottom of this document to find how to handle redirects from your app for authentication.
### Development
1. Run `npm i`.
2. Run the following command (without brackets):

```
 node ./scripts/create-application-client mongodbConenctionString={{mongodb_connection_string}} clientSecret={{client_secret}} redirectUrls={{comma_seperated_list_of_redirect_urls}}
```

3. Copy and rename file `src/public/app-config.sample.json` to `app-config.json` and replace the variables (*most importantly, `oauth -> clientId` and `oauth -> redirectUri` from previous step*).
4. A large part of the service is configurable. You can find the configurable options in file [src/service/configuration/options.json](src/service/configuration/options.json). Parameters like MongoDB connection string and Redis connection settings can be changed. Simply copy the envName of the option youd like to set and put it in your `.env` with your intended value. For the most minimal setup, you probably need to change only `MONGO_DB_CONNECTION_STRING`, `REDIS_PORT`, `REDIS_HOST`, `REDIS_USERNAME` and `REDIS_PASSWORD`. Alternatively, you could also use the [Liquid Option Manager](https://liquid-om.netlify.app/) to edit your service backend configurations and export them as `.env` to use in your setup. 
5. Start the server using command `npm run start:dev` (Or better yet, press the debug button if you are on VS Code). Your service should be running on http://localhost:2000.
6. Run `npm run build` to output production ready code.

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
