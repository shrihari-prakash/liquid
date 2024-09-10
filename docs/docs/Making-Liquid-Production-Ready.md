---
title: Making Liquid Production Ready
---

## Important backend configurations to update

To make Liquid production ready, there are a few recommended configurations to be done on the backend side:

### Cookie Configurations:
* Set ***cookie-session-secret*** to a secure random string. You can use [this tool](https://www.uuidgenerator.net/guid) to generate one.
*  Set ***cookie.secure*** to true.

### Core Environmental Configurations:
* Set ***system.reverse-proxy-mode*** to true if you intend to use a reverse proxy like Nginx.
* Set ***environment*** to production.

### Account Creation and Email Adapter Configurations:

* Set ***email.outbound-address*** to the email address that you intend to send emails to users from. It is important that this address matches the email address configured in your mail adapter.
* Set ***user.account-creation.require-email-verification*** to true.
* Set ***privilege.can-reset-password*** to true.

To send outbound emails from Liquid, say, for account verification and password reset, you can either use a Sendgrid account or your own SMTP server by configuring Nodemailer.

#### Using Sendgrid:
* Set ***system.email-adapter*** to ***sendgrid***.
* Set ***sendgrid.api-key*** to your SendGrid API key.

#### Using Nodemailer:
* Set ***system.email-adapter*** to `nodemailer`.
* Set ***nodemailer.service-name*** to `gmail` or `outlook` if you use those services. Do not set if you are using a custom SMTP server.
* Set ***nodemailer.host*** to your SMTP server host.
* Set ***nodemailer.port*** to your SMTP server port.
* Set ***nodemailer.secure*** to true if your SMTP server uses a secure connection.
* Set ***nodemailer.username*** to the username of your SMTP account.
* Set ***nodemailer.password*** to the password of your SMTP account.

### Caching:
* Set ***privilege.can-use-cache*** to true.
* Set ***redis.port***, ***redis.host***, ***redis.username***, ***redis.password***, and ***redis.db***.

### Database:
* Set ***mongo-db.connection-string*** to your MongoDB URL.

## Recommended configurations for MongoDB

In a production setup, we recommend turning on transactions by setting the option `mongo-db.use-transactions` to true. This makes sure API calls with multiple write operations don't result in inconsistent database states if some of them fail and some of them succeed.

## Recommended configurations for account creation

To reduce the amount of spam accounts, Liquid has an IP based user account creation throttling mechanism.

Use the following options to adjust this throttling:
* Set ***user.account-creation.enable-ip-based-throttle*** to `true`. 
* The window size for the throttle can be controlled by setting the option ***user.account-creation.ip-based-throttle.window-size*** to the desired number of seconds. For example, if you set ***user.account-creation.ip-based-throttle.window-size*** to 3600, Liquid will allow only one account per hour to be created from the same IP.

## Special Configurations for Nginx Reverse Proxy

It is important that you configure the `headers X-Forwarded-Proto` and `X-Forwarded-For` as follows to ensure that the security features work properly:

```nginx
location / {
  # other reverse proxy configurations...
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
}
```
