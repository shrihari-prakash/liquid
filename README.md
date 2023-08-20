# <img src="https://github.com/shrihari-prakash/liquid/blob/main/src/public/images/app-icon-mini-dark.png" width="26" height="26"> Liquid: Seamless and highly customizable authentication and user management server for any project.

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

The core OAuth logic of Liquid is powered by [node-oauth2-server](https://github.com/node-oauth/node-oauth2-server) from [@node-oauth](https://github.com/node-oauth).

## ⚙️ Setup

#### For setup instructions and documentation, see the [Liquid Wiki](https://github.com/shrihari-prakash/liquid/wiki).
