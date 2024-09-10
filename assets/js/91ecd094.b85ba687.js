"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[618],{1937:e=>{e.exports=JSON.parse('{"version":{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"noIndex":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"tutorialSidebar":[{"type":"link","label":"Intro","href":"/liquid/","docId":"Intro","unlisted":false},{"type":"link","label":"Setup","href":"/liquid/Setup","docId":"Setup","unlisted":false},{"type":"link","label":"Making Liquid Production Ready","href":"/liquid/Making-Liquid-Production-Ready","docId":"Making-Liquid-Production-Ready","unlisted":false},{"type":"link","label":"Understanding Access Control and Integrating with other Microservices","href":"/liquid/Understanding-Access-Control-and-Integrating-with-Other-Microservices","docId":"Understanding-Access-Control-and-Integrating-with-Other-Microservices","unlisted":false},{"type":"link","label":"Debugging Common Errors","href":"/liquid/Debugging-Common-Errors","docId":"Debugging-Common-Errors","unlisted":false},{"type":"category","label":"Fields and Attributes","items":[{"type":"link","label":"General Fields","href":"/liquid/fields-and-attributes/General-Fields","docId":"fields-and-attributes/General-Fields","unlisted":false},{"type":"link","label":"Special Fields","href":"/liquid/fields-and-attributes/Special-Fields","docId":"fields-and-attributes/Special-Fields","unlisted":false},{"type":"link","label":"Custom Data","href":"/liquid/fields-and-attributes/Custom-Data","docId":"fields-and-attributes/Custom-Data","unlisted":false}],"collapsed":true,"collapsible":true},{"type":"category","label":"Features","items":[{"type":"link","label":"Two Factor Authentication","href":"/liquid/features/Two-Factor-Authentication","docId":"features/Two-Factor-Authentication","unlisted":false},{"type":"link","label":"Invite Only Mode","href":"/liquid/features/Invite-Only-Mode","docId":"features/Invite-Only-Mode","unlisted":false},{"type":"link","label":"Profile Pictures","href":"/liquid/features/Profile-Pictures","docId":"features/Profile-Pictures","unlisted":false},{"type":"link","label":"Google SSO","href":"/liquid/features/Google-SSO","docId":"features/Google-SSO","unlisted":false}],"collapsed":true,"collapsible":true},{"type":"category","label":"API Documentation","items":[{"type":"link","label":"API-Documentation: OAuth 2.0","href":"/liquid/api-documentation/API-Documentation-OAuth-2.0","docId":"api-documentation/API-Documentation-OAuth-2.0","unlisted":false},{"type":"link","label":"API-Documentation: Delegated","href":"/liquid/api-documentation/API-Documentation-Delegated","docId":"api-documentation/API-Documentation-Delegated","unlisted":false},{"type":"link","label":"API-Documentation: Admin","href":"/liquid/api-documentation/API-Documentation-Admin","docId":"api-documentation/API-Documentation-Admin","unlisted":false},{"type":"link","label":"API-Documentation: Client","href":"/liquid/api-documentation/API-Documentation-Client","docId":"api-documentation/API-Documentation-Client","unlisted":false}],"collapsed":true,"collapsible":true}]},"docs":{"api-documentation/API-Documentation-Admin":{"id":"api-documentation/API-Documentation-Admin","title":"API-Documentation: Admin","description":"To take administrative actions like managing users, connected apps and permissions, it is recommended that you use The Nitrogen Project instead of rolling your own admin management portal. Nitrogen seamlessly connects with any Liquid instance with minimal configuration and uses the same administrative APIs under the hood.","sidebar":"tutorialSidebar"},"api-documentation/API-Documentation-Client":{"id":"api-documentation/API-Documentation-Client","title":"API-Documentation: Client","description":"Accessible by client_credentials grant. Usually accessed by other microservices in your system.","sidebar":"tutorialSidebar"},"api-documentation/API-Documentation-Delegated":{"id":"api-documentation/API-Documentation-Delegated","title":"API-Documentation: Delegated","description":"Usually accessible by authorization_code grant. Users typically have permissions to access all these APIs at the time of account creation. All API calls are made on behalf of the user associated with the token.","sidebar":"tutorialSidebar"},"api-documentation/API-Documentation-OAuth-2.0":{"id":"api-documentation/API-Documentation-OAuth-2.0","title":"API-Documentation: OAuth 2.0","description":"All standard OAuth APIs use sake_case for both request and response parameters to comply with the OAuth 2.0 specifications. The introspect API is specific to Liquid which alone uses camelCase.","sidebar":"tutorialSidebar"},"Debugging-Common-Errors":{"id":"Debugging-Common-Errors","title":"Debugging Common Errors","description":"This page will be updated with most common errors people encounter while setting up Liquid.","sidebar":"tutorialSidebar"},"features/Google-SSO":{"id":"features/Google-SSO","title":"Google SSO","description":"Before you get started, you will need to create a Google OAuth client. See how to do this here//support.google.com/cloud/answer/6158849?hl=en","sidebar":"tutorialSidebar"},"features/Invite-Only-Mode":{"id":"features/Invite-Only-Mode","title":"Invite Only Mode","description":"Using the optional invite-only sign-up feature can be an effective way to create virality because it encourages existing users to invite their network to join the product. This also doubles as a spam account prevention system by ensuring a controlled userbase growth.","sidebar":"tutorialSidebar"},"features/Profile-Pictures":{"id":"features/Profile-Pictures","title":"Profile Pictures","description":"The Profile pictures feature usually requires an Amazon S3 or any S3 compatible storage system like Cloudflare R2.","sidebar":"tutorialSidebar"},"features/Two-Factor-Authentication":{"id":"features/Two-Factor-Authentication","title":"Two Factor Authentication","description":"Two factor authentication can greatly improve user account security. When logging in, 2FA logic sends a 6 digit code to the email ID of the user. This code needs to be entered on the next screen to login successfully.","sidebar":"tutorialSidebar"},"fields-and-attributes/Custom-Data":{"id":"fields-and-attributes/Custom-Data","title":"Custom Data","description":"If the set of pre-defined fields is not enough for your use case, it is possible to add your own custom data to a user. Think of it like a small JSON storage where you can store things like a user\'s theme choice, onboarding status, or their address details. Quite literally anything you can think of. The PUT custom-data can be used to do this.","sidebar":"tutorialSidebar"},"fields-and-attributes/General-Fields":{"id":"fields-and-attributes/General-Fields","title":"General Fields","description":"Liquid offers a large variety of fields and attributes that you can use for various purposes. These fields are typically categorized into 3 categories according to how sensitive they are. Below is a list of all fields along with their sensitivity levels:","sidebar":"tutorialSidebar"},"fields-and-attributes/Special-Fields":{"id":"fields-and-attributes/Special-Fields","title":"Special Fields","description":"These are fields that are readable by all delegated and admin APIs, but are not directly mutable by patch APIs. These instead require special set of APIs that have built-in rules.","sidebar":"tutorialSidebar"},"Intro":{"id":"Intro","title":"Intro","description":"Seamless and highly customizable authentication and user management server for any project. \u2728","sidebar":"tutorialSidebar"},"Making-Liquid-Production-Ready":{"id":"Making-Liquid-Production-Ready","title":"Making Liquid Production Ready","description":"Important backend configurations to update","sidebar":"tutorialSidebar"},"Setup":{"id":"Setup","title":"Setup","description":"Before you start","sidebar":"tutorialSidebar"},"Understanding-Access-Control-and-Integrating-with-Other-Microservices":{"id":"Understanding-Access-Control-and-Integrating-with-Other-Microservices","title":"Understanding Access Control and Integrating with other Microservices","description":"Introduction to scope based access control","sidebar":"tutorialSidebar"}}}}')}}]);