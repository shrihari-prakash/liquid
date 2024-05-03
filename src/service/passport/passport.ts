import passport from 'passport';
import { Configuration } from '../../singleton/configuration.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export class Passport {
    constructor() {
        if (Configuration.get("user.account-creation.sso.google.enabled")) {
            passport.use(new GoogleStrategy({
                clientID: Configuration.get("user.account-creation.sso.google.client-id"),
                clientSecret: Configuration.get("user.account-creation.sso.google.client-secret"),
                callbackURL: '/oauth2/redirect/google',
                scope: [ 'profile' ]
              }, function verify(_: any, profile, cb) {
                
              }));
        }
    }
}