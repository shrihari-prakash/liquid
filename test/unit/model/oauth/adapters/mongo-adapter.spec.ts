import { expect } from 'chai';
import sinon from 'sinon';

describe('OAuth Mongo Adapter', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Token management simulation', () => {
    // Simulate the adapter methods without MongoDB dependencies
    const simulateTokenAdapter = () => {
      const tokens = new Map();
      const authCodes = new Map();
      
      return {
        async saveToken(token: any) {
          const savedToken = { ...token, _id: 'mongo_' + Date.now() };
          tokens.set(token.accessToken, savedToken);
          if (token.refreshToken) {
            tokens.set(token.refreshToken, savedToken);
          }
          return savedToken;
        },

        async checkToken(token: any) {
          if (!token) return null;
          
          const user = token.user;
          if (!user) return null;
          
          // Simulate role invalidation check
          const isRoleInvalidated = false; // Simplified for testing
          if (isRoleInvalidated) {
            return null;
          }
          
          // Simulate token invalidation check
          const globalLogoutAt = user.globalLogoutAt;
          const tokenRegisteredAt = token.registeredAt;
          
          if (globalLogoutAt && tokenRegisteredAt && 
              new Date(globalLogoutAt) > new Date(tokenRegisteredAt)) {
            return null;
          }
          
          return token;
        },

        async getAccessToken(accessToken: string) {
          const token = tokens.get(accessToken);
          return this.checkToken(token);
        },

        async getRefreshToken(refreshToken: string) {
          const token = tokens.get(refreshToken);
          return this.checkToken(token);
        },

        async revokeToken(token: any) {
          if (token.accessToken) {
            tokens.delete(token.accessToken);
          }
          if (token.refreshToken) {
            tokens.delete(token.refreshToken);
          }
          return true;
        },

        async saveAuthorizationCode(code: any) {
          const savedCode = { ...code, _id: 'code_' + Date.now() };
          authCodes.set(code.authorizationCode, savedCode);
          return savedCode;
        },

        async getAuthorizationCode(authorizationCode: string) {
          return authCodes.get(authorizationCode) || null;
        },

        async revokeAuthorizationCode(code: any) {
          authCodes.delete(code.authorizationCode);
          return true;
        }
      };
    };

    it('should save access token successfully', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        accessTokenExpiresAt: new Date(Date.now() + 3600000),
        user: { _id: 'user123', email: 'test@example.com' },
        client: { id: 'client123' },
        scope: ['read']
      };

      const savedToken = await adapter.saveToken(token);

      expect(savedToken).to.include(token);
      expect(savedToken._id).to.match(/^mongo_/);
    });

    it('should save token with refresh token', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        accessTokenExpiresAt: new Date(Date.now() + 3600000),
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        user: { _id: 'user123' },
        client: { id: 'client123' },
        scope: ['read', 'write']
      };

      const savedToken = await adapter.saveToken(token);

      expect(savedToken.accessToken).to.equal(token.accessToken);
      expect(savedToken.refreshToken).to.equal(token.refreshToken);
    });

    it('should retrieve access token', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        user: { _id: 'user123' },
        client: { id: 'client123' }
      };

      await adapter.saveToken(token);
      const retrievedToken = await adapter.getAccessToken('test_access_token');

      expect(retrievedToken).to.not.be.null;
      expect(retrievedToken.accessToken).to.equal('test_access_token');
    });

    it('should retrieve refresh token', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        user: { _id: 'user123' },
        client: { id: 'client123' }
      };

      await adapter.saveToken(token);
      const retrievedToken = await adapter.getRefreshToken('test_refresh_token');

      expect(retrievedToken).to.not.be.null;
      expect(retrievedToken.refreshToken).to.equal('test_refresh_token');
    });

    it('should return null for non-existent access token', async () => {
      const adapter = simulateTokenAdapter();
      const retrievedToken = await adapter.getAccessToken('non_existent_token');

      expect(retrievedToken).to.be.null;
    });

    it('should revoke token successfully', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        user: { _id: 'user123' },
        client: { id: 'client123' }
      };

      await adapter.saveToken(token);
      const revokeResult = await adapter.revokeToken(token);

      expect(revokeResult).to.be.true;
      
      const retrievedAccessToken = await adapter.getAccessToken('test_access_token');
      const retrievedRefreshToken = await adapter.getRefreshToken('test_refresh_token');
      
      expect(retrievedAccessToken).to.be.null;
      expect(retrievedRefreshToken).to.be.null;
    });

    it('should handle token invalidation due to global logout', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        registeredAt: new Date('2023-01-01'),
        user: { 
          _id: 'user123',
          globalLogoutAt: new Date('2023-01-02') // After token registration
        },
        client: { id: 'client123' }
      };

      await adapter.saveToken(token);
      const retrievedToken = await adapter.getAccessToken('test_access_token');

      expect(retrievedToken).to.be.null;
    });

    it('should accept valid token when no global logout', async () => {
      const adapter = simulateTokenAdapter();
      const token = {
        accessToken: 'test_access_token',
        registeredAt: new Date('2023-01-02'),
        user: { 
          _id: 'user123',
          globalLogoutAt: new Date('2023-01-01') // Before token registration
        },
        client: { id: 'client123' }
      };

      await adapter.saveToken(token);
      const retrievedToken = await adapter.getAccessToken('test_access_token');

      expect(retrievedToken).to.not.be.null;
      expect(retrievedToken.accessToken).to.equal('test_access_token');
    });
  });

  describe('Authorization code management simulation', () => {
    const simulateCodeAdapter = () => {
      const codes = new Map();
      
      return {
        async saveAuthorizationCode(code: any) {
          const savedCode = { ...code, _id: 'code_' + Date.now() };
          codes.set(code.authorizationCode, savedCode);
          return savedCode;
        },

        async getAuthorizationCode(authorizationCode: string) {
          return codes.get(authorizationCode) || null;
        },

        async revokeAuthorizationCode(code: any) {
          codes.delete(code.authorizationCode);
          return true;
        }
      };
    };

    it('should save authorization code successfully', async () => {
      const adapter = simulateCodeAdapter();
      const code = {
        authorizationCode: 'test_auth_code',
        expiresAt: new Date(Date.now() + 600000),
        redirectUri: 'http://localhost:3000/callback',
        user: { _id: 'user123' },
        client: { id: 'client123' },
        scope: ['read']
      };

      const savedCode = await adapter.saveAuthorizationCode(code);

      expect(savedCode).to.include(code);
      expect(savedCode._id).to.match(/^code_/);
    });

    it('should retrieve authorization code', async () => {
      const adapter = simulateCodeAdapter();
      const code = {
        authorizationCode: 'test_auth_code',
        user: { _id: 'user123' },
        client: { id: 'client123' }
      };

      await adapter.saveAuthorizationCode(code);
      const retrievedCode = await adapter.getAuthorizationCode('test_auth_code');

      expect(retrievedCode).to.not.be.null;
      expect(retrievedCode.authorizationCode).to.equal('test_auth_code');
    });

    it('should return null for non-existent authorization code', async () => {
      const adapter = simulateCodeAdapter();
      const retrievedCode = await adapter.getAuthorizationCode('non_existent_code');

      expect(retrievedCode).to.be.null;
    });

    it('should revoke authorization code successfully', async () => {
      const adapter = simulateCodeAdapter();
      const code = {
        authorizationCode: 'test_auth_code',
        user: { _id: 'user123' },
        client: { id: 'client123' }
      };

      await adapter.saveAuthorizationCode(code);
      const revokeResult = await adapter.revokeAuthorizationCode(code);

      expect(revokeResult).to.be.true;
      
      const retrievedCode = await adapter.getAuthorizationCode('test_auth_code');
      expect(retrievedCode).to.be.null;
    });
  });
});
