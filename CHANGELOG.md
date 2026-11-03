# Changelog

## 2.0.4

- Added configuration options for user search filtering and privileges in `options.json`:
  - `admin-api.user.search.search-fields` and `admin-api.user.search.strict-match-fields`.
  - `admin-api.privilege.user.search.can-use-id` and `admin-api.privilege.user.search.can-use-fullname`.
  - `admin-api.user.search-results.limit`.
  - `user.search.search-fields` and `user.search.strict-match-fields`.
  - `privilege.user.search.can-use-id` and `privilege.user.search.can-use-fullname`.
- Added interactive `ScopesViewer` and `OptionsViewer` components with configuration reference pages in documentation.
- Documented dynamic scope lifecycle, token refreshing, and client-specific permission handling.

## 2.0.3

- Implemented OAuth scope validation and recalculation utilities.
- Updated Redis adapter token handling and cache invalidation.

## 2.0.2

- Refactored OTP input to interactive slotted UI component.
- Modernized verification code email template.

## 2.0.1

- Updated verification email subject line and simplified template styling.

## 2.0.0

- Added PKCE default public client support, automatic secret clearing on public clients, and `OAuthGrant` enum.
