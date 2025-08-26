---
title: Google SSO
---

# Google SSO Setup

## Step 1: Google Client Creation

Create a Google OAuth client by following the instructions here: https://support.google.com/cloud/answer/6158849?hl=en

When creating your Google OAuth client, make sure to configure:

- **Authorized redirect URIs**: `https://your-liquid-instance.com/sso/google/callback`
- **Authorized JavaScript origins**: `https://your-liquid-instance.com`

Replace `your-liquid-instance.com` with your actual domain.

## Step 2: Backend Option Configuration

Once you've acquired your client ID and client secret, configure the following options on the backend to enable the "Signup with Google" button:

1. Set `system.app-host` to the public host of your liquid instance. For example, https://accounts.your-app.com.
2. Set `user.account-creation.sso.google.enabled` to true.
3. Configure `user.account-creation.sso.google.client-id`.
4. Configure `user.account-creation.sso.google.client-secret`.

Now the login and signup pages should have the Google sign-in button.

:::info

Invite-Only mode cannot be used when Google SSO is enabled. Invite-Only is automatically turned off when enabling Google SSO.

:::

