---
title: Understanding Access Control and Integrating with other Microservices
---

## Introduction to scope based access control

Liquid uses a list of permission names (also known as scopes) to determine if a user is authorized to access a specific API / resource. There is a set of default permissions assigned to users at the time of account creation. By default, the scope assigned is `delegated:all`, but it can be changed by setting the option `user.account-creation.default-scope` to a comma separated list of scopes you would like to be assigned for a user at the time of account creation. This does not affect any of the existing accounts. `delegated:all` means the user has access to all user level APIs like follow, unfollow, block, unblock and profile edit, but no access to admin level APIs.

[See list of all scopes available in Liquid](https://github.com/shrihari-prakash/liquid/blob/main/src/service/scope-manager/scopes.json)

You can assign additional scopes to users than the ones assigned at the time of account creation by using the `/user/admin-api/access` endpoint. You either need to be a super_admin or you need to have access to the scope `admin:profile:access:write` to use this API. Here's a sample request to the endpoint which assigns a user access to some admin APIs:

Request:

```
POST https://liquid-host/user/admin-api/access
```

Body:

```json
{
  "targets": ["list", "of", "user", "ids"],
  "targetType": "user",
  "scope": ["admin:profile:all", "admin:profile:ban:write", "admin:profile:credits:write"],
  "operation": "set"
}
```

The above request provides an user permissions to edit other user's profile info, ban other users in the system and create OAuth clients that can access client APIs. `targetType` can be either `user`, `client` or `role`. Use operations `del` or `add` for more granular control.

Users can be assigned scopes either directly or through their roles. During OAuth authorization, a requested scope is granted only when the user has the scope directly or via their role and the requesting client also has access to the respective scope.

:::warning

As a general best practice, it is preferrable to assign permissions to users starting with the least privilege and then move up to more generic permissions if they need more. Assigning scopes like `*` and `admin:all` can give users more permissions than they actually require and can be catastrophic. Don't shoot yourself in the foot.

:::

You can remove permissions by sending `status` attribute as false.

## Extending the Scope list

If you have the need to add some additional scopes in the service, which you probably will (for instance, you might want to introduce a scope called `delegated:chat:read` which controls if users can read a chat in your chat microservice), you can do so by passing to Liquid a JSON file that contains the metadata about the new scopes.

Here's a sample `scope-extensions.json` file:

```json
[
  {
    "name": "sub-scope",
    "description": "A scope that directly gets attached under *",
    "parent": "*"
  },
  {
    "name": "delegated:chat:all",
    "description": "View and manage your chats.",
    "parent": "delegated:all"
  },
  {
    "name": "delegated:chat:read",
    "description": "View your chat history.",
    "parent": "delegated:chat:all"
  },
  {
    "name": "delegated:chat:write",
    "description": "Manage your chat history.",
    "parent": "delegated:chat:all"
  }
]
```

The `parent` field specifies the hierarchy of permissions. In this case, if a user is assigned `delegated:chat:all`, they implicitly have the permissions `delegated:chat:read` and `delegated:chat:write`.

Once this file is ready, you can extend the Liquid scopes by providing the path to this file in the option `system.scope-extension-file-path`. Note that scope tree is printed by Liquid when you run the service. Check the logs to see if the extended hierarchy is as indented.

## Connecting to liquid from other microservices

If the microservices that need to use Liquid as an auth service are running on Node.js, you can authenticate your routes by using the [Liquid Node Authenticator](https://www.npmjs.com/package/liquid-node-authenticator) package.

When you authenticate a user by using `const tokenDetails = liquidAuthenticator.authenticate(token);`, Liquid returns some important information about the token and the user associated with it.

You can get the user associated with the token by inspecting the `tokenDetails.user` field.

Under the hood, Liquid Node Authenticator (LNA) utilizes the API endpoint `/oauth/introspect` by sending the token in `token` field of the request body to get this information. If your microservice is not running on node, you can use this API to authenticate users from your microservice.

Each token comes with a `scope` field that contains all authorized scopes for the token. You can choose to disallow an API call if the scope field doesn't include the scope that is required for an API call. This is extremely simple to do in Liquid Node Authenticator. Simply call the `checkTokenScope` method with the token details:

```js
// auth-middleware.js

// Some code...
const tokenDetails = await liquidAuthenticator.authenticate(token);
// Save token details to res.locals or somewhere accessible by the API code
// More code...

// api.js

// Some code...
// Get tokenDetails from res.locals

const allowed = await liquidAuthenticator.checkTokenScope(
  "your:scope:name",
  token /* tokenDetails object acqurired in authenticate() function */
);

if (allowed) {
  // Scope is allowed, continue with action
} else {
  // Scope is NOT allowed, send insufficient priviledge error
}

```

If for some reason, you want to do the scope checking by yourself **(NOT RECOMMENDED)**, here's a sample implementation:

```js
const response = await fetch(`https://liquid-host/user/scopes`);
const scopes = (await response.json()).data.scopes;

function isScopeAllowed(scope, allowedScopes) {
  const scopeObject = scopes[scope];
  if (!scopeObject) {
    return false;
  }
  if (allowedScopes.includes(scopeObject.name) || allowedScopes.includes(scopeObject.parent)) {
    return true;
  } else if (scopeObject.parent) {
    return isScopeAllowed(scopeObject.parent, allowedScopes);
  } else {
    return false;
  }
}

console.log(
  isScopeAllowed("delegated:chat:read", ["delegated:chat:all"])
); // true
```