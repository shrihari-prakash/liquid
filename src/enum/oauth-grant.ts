export const OAuthGrant = {
  CLIENT_CREDENTIALS: "client_credentials",
  AUTHORIZATION_CODE: "authorization_code",
  REFRESH_TOKEN: "refresh_token",
  PASSWORD: "password",
} as const;

export type OAuthGrantType = (typeof OAuthGrant)[keyof typeof OAuthGrant];
