---
slug: /
title: Intro
---

# Liquid

## Seamless and highly customizable authentication and user management server for any project. ✨

Liquid is a Docker-based open-source authentication server that supercharges your product development by offering out of the box APIs for features like follow-unfollow, blocking, and banning so that you can focus on just your application logic. 🚀

![](https://github.com/shrihari-prakash/liquid/raw/main/images/liquid-banner.png)

Think of Liquid like integrating a readymade authentication and user management server with your own codebase. You just boot up Liquid in a docker container with a few configuration files and it is all good to go.

For setting up Liquid, refer to the [Setup](/Setup) page.

# Quick Start

:::danger

**You should NEVER use the Quickstart for production deployments. For production usage, please follow the [Setup](/Setup) page and then refer to the [Production Guide](/Making-Liquid-Production-Ready).**

:::

If you're looking for the quickest and most convenient way to run Liquid without installing manually the dependencies for database and cache by yourself, do the following:

1. Run

```shell
curl -sSL --insecure https://raw.githubusercontent.com/shrihari-prakash/liquid/main/quickstart/docker-compose.yaml > docker-compose.yaml
curl -sSL --insecure https://raw.githubusercontent.com/shrihari-prakash/liquid/main/quickstart/app-config.service.json > app-config.service.json
curl -sSL --insecure https://raw.githubusercontent.com/shrihari-prakash/liquid/main/quickstart/app-config.static.json > app-config.static.json
```

1. In the `app-config.service.json` file, add your frontend origin in `cors.allowed-origins` array (just the origin, not the redirect URI).
2. Run `docker-compose up -d`.

This is useful if you want to try and evaluate Liquid to see if it fits your needs or to locally develop your apps with Liquid.

## Connecting Your Frontend Application to Liquid Quickstart Instance

For Liquid to securely allow your frontend to authenticate, you will need to add your frontend redirect URI to the trusted list.

### Nitrogen Configuration

1. Login to the [Nitrogen admin panel](http://localhost:2001).
2. Navigate to the `Applications` tab.
3. Click the Edit button.
4. In the redirect URIs section, add your frontend origin.
5. Press Enter.
6. Click Save.

### Test connectivity

1. Open your client application (or Nitrogen at http://localhost:2001) which initiates the login redirect with PKCE parameters (`code_challenge` and `code_challenge_method=S256`).
2. Enter the login details on Liquid's authentication page and click Login.
3. You are now navigated back to your application with `code` and `state` parameters in the URL.
4. Refer to [this section](/api-documentation/API-Documentation-OAuth-2.0#setting-up-pkce-for-public-clients-spas--mobile-apps) to see how your app exchanges `code` and `code_verifier` at `POST /oauth/token` for access tokens.

The Quickstart script by default runs in "Demo Mode", which means, an application and a user is already created for you so that you can jump straight into evaluating Liquid with zero configuration. The script also comes with the [Nitrogen admin panel](https://github.com/shrihari-prakash/nitrogen) preconfigured. You can manage users and permissions by navigating to http://localhost:2001.

## Demo user

**Username:** liquid_demo

**Password:** liquid_demo

:::danger

**Again, you should NEVER use the Quickstart for production deployments. For production usage, please follow the [Setup](/Setup) page and then refer to the [Production Guide](/Making-Liquid-Production-Ready).**

:::

## Connecting Your Backend Service to Liquid Quickstart Instance

Refer to [this section](/Understanding-Access-Control-and-Integrating-with-Other-Microservices) to find out how to authenticate users connecting to your service using Liquid.

## 🔐 OAuth 2.0 Core Concepts & Standards

If you are new to OAuth 2.0, Liquid adheres strictly to official IETF standards and RFC specifications. Here are key concepts and official references to help you learn:

- **[Authorization Code Grant (RFC 6749 § 4.1)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1)** — The standard authorization flow for web applications and SPAs ([OAuth.net Guide](https://oauth.net/2/grant-types/authorization-code/)).
- **[Client Credentials Grant (RFC 6749 § 4.4)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4)** — Machine-to-machine server authentication ([OAuth.net Guide](https://oauth.net/2/grant-types/client-credentials/)).
- **[PKCE - Proof Key for Code Exchange (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)** — Mandatory security extension for public clients (SPAs and Mobile apps) ([OAuth.net Guide](https://oauth.net/2/pkce/)).
- **[Refresh Token Grant (RFC 6749 § 6)](https://datatracker.ietf.org/doc/html/rfc6749#section-6)** — Token renewal without forcing user re-login ([OAuth.net Guide](https://oauth.net/2/grant-types/refresh-token/)).
- **[OAuth 2.0 for Browser-Based Apps (IETF BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)** — Best Current Practice guidelines for Single Page Applications (SPAs).

## 📦 Official SDKs & Packages

- **[liquid-js-sdk](https://www.npmjs.com/package/liquid-js-sdk):** Universal TypeScript/JavaScript SDK for web browsers and Node.js with complete type safety across all Liquid APIs (`liquid.users.*`, `liquid.admin.*`, `liquid.client.*`, `liquid.oauth.*`, `liquid.roles.*`, `liquid.system.*`, `liquid.health.*`, `liquid.sso.*`).
- **[liquid-node-authenticator](https://www.npmjs.com/package/liquid-node-authenticator):** Express middleware for token authentication and scope verification.

## API Documentation

Get started with the APIs [here](/api-documentation/API-Documentation-OAuth-2.0)

