---
title: Making Liquid Production Ready
---

## Important backend configurations to update

To make Liquid production ready, there are a few recommended configurations to be done on the backend side:

### Cookie Configurations

- Set **_cookie-session-secret_** to a secure random string. You can use [this tool](https://www.uuidgenerator.net/guid) to generate one.
- Set **_cookie.secure_** to true.

### Core Environmental Configurations

- Set **_system.reverse-proxy-mode_** to true if you intend to use a reverse proxy like Nginx.
- Set **_environment_** to production.

### Account Creation and Email Adapter Configurations

- Set **_email.outbound-address_** to the email address that you intend to send emails to users from. It is important that this address matches the email address configured in your mail adapter.
- Set **_user.account-creation.require-email-verification_** to true.
- Set **_privilege.can-reset-password_** to true.

To send outbound emails from Liquid, say, for account verification and password reset, you can either use a Sendgrid account or your own SMTP server by configuring Nodemailer.

#### Using Nodemailer

- Set **_system.email-adapter_** to `nodemailer`.
- Set **_nodemailer.service-name_** to `gmail` or `outlook` if you use those services. Do not set if you are using a custom SMTP server.
- Set **_nodemailer.host_** to your SMTP server host.
- Set **_nodemailer.port_** to your SMTP server port.
- Set **_nodemailer.secure_** to true if your SMTP server uses a secure connection.
- Set **_nodemailer.username_** to the username of your SMTP account.
- Set **_nodemailer.password_** to the password of your SMTP account.

#### Using Amazon SES

- Set **_system.email-adapter_** to `ses`.
- Set **_aws.ses.region_** to your AWS region.
- Set the **_aws.ses.access-key-id_**.
- Set the **_aws.ses.access-key-secret_**.

#### Using Sendgrid

- Set **_system.email-adapter_** to `sendgrid`.
- Set **_sendgrid.api-key_** to your SendGrid API key.

#### Using Message Queue (Pusher)

If none of the built-in email providers meet your needs, Liquid can put emails in a queue so that another service can consume them and send emails using your preferred custom provider.

- Set **_system.email-adapter_** to `pusher`.
- Set **_privilege.can-use-push-events_** to `true`.
- Configure your message queue by setting **_system.queue-adapter_** to either `redis` or `rabbitmq`.
- Configure the appropriate queue service (Redis or RabbitMQ) settings.

You should now get a `liquid.email.send` event when an email is triggered.

### Caching

- Set **_privilege.can-use-cache_** to true.
- Set **_redis.port_**, **_redis.host_**, **_redis.username_**, **_redis.password_**, and **_redis.db_**.

### Database

- Set **_mongo-db.connection-string_** to your MongoDB URL.

## Recommended configurations for MongoDB

In a production setup, we recommend turning on transactions by setting the option `mongo-db.use-transactions` to true. This makes sure API calls with multiple write operations don't result in inconsistent database states if some of them fail and some of them succeed.

## Recommended configurations for account creation

To reduce the amount of spam accounts, Liquid has an IP based user account creation throttling mechanism.

Use the following options to adjust this throttling:

- Set **_user.account-creation.enable-ip-based-throttle_** to `true`.
- The window size for the throttle can be controlled by setting the option **_user.account-creation.ip-based-throttle.window-size_** to the desired number of seconds. For example, if you set **_user.account-creation.ip-based-throttle.window-size_** to 3600, Liquid will allow only one account per hour to be created from the same IP.

## Special Configurations for Nginx Reverse Proxy

It is important that you configure the `headers X-Forwarded-Proto` and `X-Forwarded-For` as follows to ensure that the security features work properly:

```nginx
location / {
  # other reverse proxy configurations...
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header X-Forwarded-For $remote_addr;
}
```

