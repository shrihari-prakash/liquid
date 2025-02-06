---
title: Two Factor Authentication
---

# Two-Factor Authentication

Two factor authentication can greatly improve user account security. When logging in, 2FA logic sends a 6 digit code to the email ID of the user. This code needs to be entered on the next screen to login successfully.

To allow users to enable two factor authentication, enable the option `2fa.email.enabled`. If you want to enfore all users to complete a two factor authentication challenge while logging in, enable the option `2fa.email.enforce` in addition to enabling `2fa.email.enabled`.

Note that this feature requires email features to be configured. See configurations starting with `email.`, `sendgrid.` and `nodemailer.`