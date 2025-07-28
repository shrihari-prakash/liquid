---
title: Special Fields
---

These are fields that are readable by all delegated and admin APIs, but are not directly mutable by patch APIs. These instead require special set of APIs that have built-in rules.

## Verifications

See verifications API usage [here](/api-documentation/API-Documentation-Admin#verify-user). Verifications are exclusive to admin APIs.

1. verified
2. verifiedDate
3. verifiedBy

## Suspensions

See ban API usage [here](/api-documentation/API-Documentation-Client#ban-user) (Client API) and [here](/api-documentation/API-Documentation-Admin#ban-user) (Admin API)

1. isBanned
2. bannedDate
3. bannedBy

## Restricted Accounts

By default, Liquid does not use `isRestricted` flag for anything at all. But this is a useful feature if you want to shadow ban a user. For instance, based on this flag, you could decide to restrict how often people see a user's post. See restrict API usage [here](/api-documentation/API-Documentation-Client#restrict-user) (Client API) and [here](/api-documentation/API-Documentation-Admin#restrict-user) (Admin API)

1. isRestricted
2. restrictedDate
3. restrictedBy

## Credits / Virtual Money

Credits are usually similar to virtual money that you can use for controlling paid features. You can also use this as a reward points system. See usage [here](/api-documentation/API-Documentation-Client#update-user-credits) (Client API) and [here](/api-documentation/API-Documentation-Admin#update-user-credits) (Admin API)

1. credits

## Subscriptions

Subscription fields manage user subscription status, tiers, and cancellation information. See usage [here](/api-documentation/API-Documentation-Client#subscription-management) (Client API) and [here](/api-documentation/API-Documentation-Admin#subscription-management) (Admin API)

1. isSubscribed - Boolean indicating if the user has an active subscription
2. subscriptionTier - String representing the subscription tier (e.g., "basic", "premium")
3. subscriptionIdentifier - String or Number for external subscription tracking (e.g., payment system ID)
4. subscriptionActivatedAt - Date when the subscription was activated
5. subscriptionExpiry - Date when the subscription expires
6. subscriptionCancelled - Boolean indicating if the subscription has been cancelled
7. subscriptionCancelledAt - Date when the subscription was cancelled

