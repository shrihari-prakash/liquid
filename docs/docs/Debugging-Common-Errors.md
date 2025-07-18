---
title: Debugging Common Errors
---

This page will be updated with most common errors people encounter while setting up Liquid.

### `Server error: handle() did not return a user object` error when redirecting back to your application

![Screenshot 2024-08-27 at 14 43 46](img/server-handle-did-not-return-a-user-object.png)

This most commonly indicates a cookie problem. The login is typically successful in these cases, but the cookie that came with the login API response was either not transmitted to or were not set by the browser.

When this happens, the following configuration might be wrong:

1. You set `cookie.secure=false` on a https server.
2. You set `cookie.secure=true` on an insecure server.
3. Your reverse proxy (like nginx in front of Liquid) is not forwarding the cookie headers set by Liquid. Read [this section](/Making-Liquid-Production-Ready#special-configurations-for-nginx-reverse-proxy) to know how to setup reverse proxies.
4. `cookie.domain` was setup for the wrong domain / sub domain.

### `Invalid client: redirect_uri does not match client value` error when redirecting back to your application

Redirect URI does not exactly match the URI setup in the `redirect_uri` field in the clients collection. You can also setup this field on Nitrogen.
