# <img src="https://github.com/shrihari-prakash/liquid/blob/main/src/public/images/app-icon-mini.png" width="26" height="26"> Liquid: Seamless and highly customizable authentication and user management server for any project.

![GitHub](https://img.shields.io/github/license/shrihari-prakash/liquid)
[![Docker Image CI](https://github.com/shrihari-prakash/liquid/actions/workflows/docker-image.yml/badge.svg)](https://github.com/shrihari-prakash/liquid/actions/workflows/docker-image.yml)
[![Integration Tests CI](https://github.com/shrihari-prakash/liquid/actions/workflows/integration-tests.yml/badge.svg)](https://github.com/shrihari-prakash/liquid/actions/workflows/integration-tests.yml)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/shrihari-prakash/liquid)
![Lines of code](https://img.shields.io/tokei/lines/github/shrihari-prakash/liquid)
![GitHub Repo stars](https://img.shields.io/github/stars/shrihari-prakash/liquid?style=social)

Liquid is a Docker-based open-source authentication server that supercharges your product development by offering out of the box APIs for features like follow-unfollow, blocking, and banning so that you can focus on just your application logic. 🚀

![Liquid](images/liquid-banner.png)

### ⭐ Features
* High degree customization capabilities. Customize and configure every part of the UI and service.
* Out of the box support for mechanisms like follow - unfollow, blocking and private accounts.
* Support for administrative APIs.
* Battle tested APIs with support for database transactions for high reliability.
* Quick setup.

## 📦 Dependencies
Almost everything is **optional** except MongoDB.
| Dependency                  | Optional | Used by Default | Related Options                                                                                            | Disable Recommended? |
| --------------------------- | -------- | --------------- | ---------------------------------------------------------------------------------------------------------- | -------------------- |
| MongoDB                     | No       | Yes             | mongo-db.connection-string                                                                                 | No                   |
| Redis                       | Yes      | Yes             | privilege.can-use-cache, redis.\*                                                                          | No                   |
| SendGrid                    | Yes      | Yes             | user.account-creation.require-email-verification (backend & frontend), privilege.can-reset-password (frontend), sendgrid.\* | No                   |
| AWS S3 (or) S3 like storage | Yes      | No              | privilege.can-use-profile-picture-apis, s3.\*                                                              | Yes                  |
| RabbitMQ                    | Yes      | No              | privilege.can-use-push-events, privilege.can-use-rabbitmq, rabbitmq.\*                                     | Yes                  |
> **_NOTE:_** If you don't want a Redis dep, it is possible force the service into using MongoDB as a replacement by changing the option `privilege.can-use-cache` to false. However, disabling this option is highly discouraged since access tokens are deleted (although invalidated) only when the refresh token expires which is typically a really long time. Also using databases for such things might not be a great idea for performance reasons.


## ⚙️ Setup
### Production Usage
The following steps assume already you have **Redis** and **MongoDB** and **Sendgrid**.
1. Pull the docker image by using command `docker pull shrihariprakash/liquid`.
2. Create a collection in your database named `clients` and insert the following document into the collection (Make sure you edit the frontend URIs and secret in the document below):

```json
{
  "id": "application_client",
  "grants": [
    "client_credentials",
    "authorization_code",
    "refresh_token"
  ],
  "redirectUris": ["{{frontend-redirect-uri-1}}", "{{frontend-redirect-uri-2}}"],
  "secret": "super-secure-client-secret",
  "role": "internal_client",
  "displayName": "Application Client"
}
```

1. In your host machine, create a file called `app-config.json` with the contents of [this file](https://raw.githubusercontent.com/shrihari-prakash/liquid/main/src/app-config.sample.json) and edit properties `oauth.client-id` and `oauth.redirect-uri` to values from the document you just inserted into clients collection. This is the configuration file used for all your frontend stuff like UI customizations.
2. Now go to [Liquid Option Manager](https://liquid-om.netlify.app/) and edit your backend configurations. For the most minimal setup, you will need to set:
   * `system.static.app-config-absolute-path` to `/environment/app-config.json`
   * `mongo-db.connection-string`
   * `sendgrid.api-key`
   * `sendgrid.outbound-email-address`
   * and options starting with `redis`. 
3. Export the configuration and **save the file as `.env`** (preferrably put it on the same folder as your app-config.json).
4. Now open terminal in the folder that contains your app-config.json.
5. If you are on Windows, run `docker run -p 2000:2000 -v "%cd%":/environment --env-file .env --name liquid -itd shrihariprakash/liquid:latest`.
6. If you are on Linux, run `docker run -p 2000:2000 -v "$(pwd)":/environment --env-file .env --name liquid -itd shrihariprakash/liquid:latest`.
7. All done ✨, navigating to `host-machine:2000` should render login page. All the APIs are ready to be called from your other services. If the rest of your project is running on Node, you can use the [Liquid Node Connector](https://github.com/shrihari-prakash/liquid-node-connector) to authenticate users connecting to your service and also to get client tokens to interact with Liquid client APIs. [Click here for Swagger](https://raw.githubusercontent.com/shrihari-prakash/liquid/main/src/swagger.yaml). Also see Sign Up and Login section in the bottom of this document to find how to handle redirects from your app for authentication.
> **_NOTE:_** If you are using nginx as reverse proxy and find that cookies are not working or if you get the error `Server error: handle() did not return a user object` while logging in, add `proxy_set_header X-Forwarded-Proto $scheme;` to server -> location in your nginx config.
### Development
1. Run `npm i`.
2. Run the following command (without brackets):

```properties
 node ./scripts/create-application-client mongodbConenctionString={{mongodb_connection_string}} clientSecret={{client_secret}} redirectUrls={{comma_seperated_list_of_redirect_urls}}
```

1. Copy and rename file `src/app-config.sample.json` to `app-config.json` and replace the variables (*most importantly, `oauth.client-id` and `oauth.redirect-uri` from previous step*).
2. A large part of the service is configurable. You can find the configurable options in file [src/service/configuration/options.json](src/service/configuration/options.json). Parameters like MongoDB connection string and Redis connection settings can be changed. Simply copy the envName of the option youd like to set and put it in your `.env` with your intended value. For the most minimal setup, you probably need to change only `MONGO_DB_CONNECTION_STRING`, `REDIS_PORT`, `REDIS_HOST`, `REDIS_USERNAME` and `REDIS_PASSWORD` and set `NODE_ENV` to development. Alternatively, you could also use the [Liquid Option Manager](https://liquid-om.netlify.app/) to edit your service backend configurations and export them as `.env` to use in your setup. 
3. Start the server using command `npm run start:dev` (Or better yet, press the debug button if you are on VS Code). Your service should be running on http://localhost:2000.
4. Run `npm run build` to output production ready code.

### 📖 API Documentation:

In development environment, swagger is available at http://localhost:2000/docs. This has the documentation for all the additional functionalities that the service offers apart from OAuth. For OAuth itself, any regular OAuth documentation should work with this. OAuth related functionalities are available at `/oauth`.

### Sign Up:

1. To create an account, visit `/signup` and fill the details.
2. Click on Create Account.
3. If you are running this on dev mode, a code is printed in your console. Enter this code on the verification page.

### Login:

1. To authenticate, redirect to `/login?redirect={{your_target_uri}}&theme={{light | dark}}` and enter your credentials. Note that the value of redirect parameter must be one of the values configured in `redirectUris` of Setup(2).
2. If the credentials are correct, the application redirects the control to the url specified in `redirect` parameter with the state and authorization code.
3. In your application logic, you can use this code in exchange for an access and refresh token using the `authorization_code` grant.
