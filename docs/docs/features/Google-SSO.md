---
title: Google SSO
---

# Google SSO Setup

Before you get started, you will need to create a Google OAuth client. See how to do this here: https://support.google.com/cloud/answer/6158849?hl=en

Once you've acquired your client ID and client secret, configure the following options on the backend to enable the "Signup with Google" button:
1. Set `system.app-host` to the public host of your liquid instance. For example, https://accounts.your-app.com.
2. Set `user.account-creation.sso.google.enabled` to true.
3. Configure `user.account-creation.sso.google.client-id`.
4. Configure `user.account-creation.sso.google.client-secret`.

Now the login and signup pages should have the Google sign-in button.

:::info

Invite-Only mode cannot be used when Google SSO is enabled. Invite-Only is automatically turned off when enabling Google SSO.

:::
