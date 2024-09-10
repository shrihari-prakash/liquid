---
title: Custom Data
---

If the set of pre-defined fields is not enough for your use case, it is possible to add your own custom data to a user. Think of it like a small JSON storage where you can store things like a user's theme choice, onboarding status, or their address details. Quite literally anything you can think of. The [PUT custom-data](/api-documentation/API-Documentation-Client#update-user-custom-data) can be used to do this.

It is recommended that you do not store any secrets / sensitive data here. If you do plan on storing such things, try to encrypt them before storing them to `customData`.

:::warning

Updating a user's custom data will overwrite any previous customData that is present. Always update the latest data object as a whole.

:::