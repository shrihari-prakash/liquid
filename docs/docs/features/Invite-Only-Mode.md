---
title: Invite Only Mode
---

# Invite-Only Mode

Using the optional invite-only sign-up feature can be an effective way to create virality because it encourages existing users to invite their network to join the product. This also doubles as a spam account prevention system by ensuring a controlled userbase growth.

## Enabling Invite-Only mode

For the very first user who will not have any invite code to signup but will invite other users, enable option `user.account-creation.force-generate-invite-codes`. This will enable invite code generation but will not require any invitation code to sign up. After some invite codes are generated, you can turn on the invite only feature by enabling option `user.account-creation.enable-invite-only`. This will require an invitation code for any user signing up into the system.

## Retrieving invite codes

The [`GET` `/user/invite-codes`](/api-documentation/API-Documentation-Delegated#get-invite-codes) API can be used to retrieve and display invite codes of a user.

## Controlling invite codes per person

To control the number of invite codes generated per user during signup, adjust the option `user.account-creation.invites-per-person`.

## Spam prevention by throttling invite code availability:

It is possible to prevent the retrieval of invite codes for a user for a specified amount of time from the time of account creation. This is particularly useful if you want people to invite other people to your system only after they have been a member for a few days. To enable this feature, set the option `user.account-creation.invite-code-availability-window` to the desired number of seconds to be elapsed since account creation.