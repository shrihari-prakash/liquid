---
title: Profile Pictures
---

# Profile Pictures

The Profile pictures feature usually requires an Amazon S3 or any S3 compatible storage system like Cloudflare R2.

See the profile pictures API documentation [here](/api-documentation/API-Documentation-Delegated#set-profile-picture).

## Enabling profile picture usage

1. Enable the option `privilege.can-use-profile-picture-apis`.
2. Enable the option `privilege.can-use-cloud-storage`.
3. Set the options `s3.endpoint`, `s3.access-key-id`, `s3.access-key-secret` and `s3.bucket-name`.

## Size restrictions

By default, the max size of the profile picture is set to `500KB`. This can be changed by changing the option `user.profile-picture.max-file-size`. The size of the file should be provided in bytes.
