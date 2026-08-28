import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Redis } from '../../../../../src/singleton/redis.js';
import { RedisPrefixes } from '../../../../../src/enum/redis.js';
import { Configuration } from '../../../../../src/singleton/configuration.js';
import { ScopeManager } from '../../../../../src/singleton/scope-manager.js';
import { Role } from '../../../../../src/singleton/role.js';

describe('RedisAdapter', () => {
  let sandbox: sinon.SinonSandbox;
  let RedisAdapter: any;
  let oauthUtilsStub: any;
  let oauthCacheStub: any;
  let sessionUtilsStub: any;
  let roleUtilsStub: any;
  let roleSingletonStub: any;
  let scopeManagerSingletonStub: any;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    
    // Create stubs for the utility modules
    oauthUtilsStub = {
      isApplicationClient: sandbox.stub(),
      validateAccessTokenScopes: sandbox.stub().resolves(true),
      recalculateRefreshTokenScopes: sandbox.stub(),
    };
    
    oauthCacheStub = {
      getUserInfo: sandbox.stub()
    };
    
    sessionUtilsStub = {
      isTokenInvalidated: sandbox.stub()
    };
    
    // Use esmock to load RedisAdapter with stubbed dependencies
    RedisAdapter = await esmock('../../../../../src/model/oauth/adapters/redis-adapter.js', {
      '../../../../../src/model/oauth/utils.js': oauthUtilsStub,
      '../../../../../src/model/oauth/cache.js': oauthCacheStub,
      '../../../../../src/utils/session.js': sessionUtilsStub,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getPrefixedToken', () => {
    it('should return prefixed token key', () => {
      const token = 'test-token-123';
      const result = RedisAdapter.getPrefixedToken(token);
      expect(result).to.equal(`${RedisPrefixes.TOKEN}${token}`);
    });
  });

  describe('getPrefixedCode', () => {
    it('should return prefixed code key', () => {
      const code = 'test-code-123';
      const result = RedisAdapter.getPrefixedCode(code);
      expect(result).to.equal(`${RedisPrefixes.CODE}${code}`);
    });
  });

  describe('saveToken', () => {
    it('should save token and refresh token to redis with expiration', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        accessTokenExpiresAt: new Date('2025-12-31T23:59:59Z'),
        refreshTokenExpiresAt: new Date('2026-01-31T23:59:59Z'),
        user: { _id: 'user-id-123', username: 'testuser' },
        client: { id: 'client-id-123', grants: ['authorization_code', 'refresh_token'] },
        scope: ['read', 'write']
      };

      sandbox.stub(Redis, 'setEx').resolves('OK' as any);
      sandbox.stub(Configuration, 'get')
        .withArgs('oauth.access-token-lifetime').returns(3600)
        .withArgs('oauth.refresh-token-lifetime').returns(7200);

      const result = await RedisAdapter.saveToken(mockToken as any);

      expect(Redis.setEx).to.have.been.calledTwice;
      expect(Redis.setEx).to.have.been.calledWith(
        `${RedisPrefixes.TOKEN}access-token-123`,
        sinon.match.string,
        3600
      );
      expect(Redis.setEx).to.have.been.calledWith(
        `${RedisPrefixes.TOKEN}refresh-token-123`,
        sinon.match.string,
        7200
      );
      expect(result).to.equal(mockToken);
      expect(result.registeredAt).to.be.a('string');
    });

    it('should save token without refresh token when refresh token is not provided', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        accessTokenExpiresAt: new Date('2025-12-31T23:59:59Z'),
        user: { _id: 'user-id-123', username: 'testuser' },
        client: { id: 'client-id-123', grants: ['client_credentials'] },
        scope: ['read']
      };

      sandbox.stub(Redis, 'setEx').resolves('OK' as any);
      sandbox.stub(Configuration, 'get')
        .withArgs('oauth.access-token-lifetime').returns(3600);

      const result = await RedisAdapter.saveToken(mockToken as any);

      expect(Redis.setEx).to.have.been.calledOnce;
      expect(Redis.setEx).to.have.been.calledWith(
        `${RedisPrefixes.TOKEN}access-token-123`,
        sinon.match.string,
        3600
      );
      expect(result).to.equal(mockToken);
    });
  });

  describe('checkToken', () => {
    it('should return null if token is null or empty', async () => {
      const result = await RedisAdapter.checkToken(null);
      expect(result).to.be.null;

      const result2 = await RedisAdapter.checkToken('');
      expect(result2).to.be.null;
    });

    it('should handle token as object', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        user: { _id: 'user-id-123', role: 'user' },
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read']
      };

      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockToken);

      expect(result).to.not.be.null;
      expect(result?.accessToken).to.equal('access-token-123');
    });

    it('should refresh user info for non-application clients', async () => {
      const originalUser = { _id: 'user-id-123', role: 'regular-user' };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: originalUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read']
      });

      const refreshedUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null,
        scope: ['read', 'write']
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(refreshedUser);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(oauthUtilsStub.isApplicationClient).to.have.been.calledWith(originalUser);
      expect(oauthCacheStub.getUserInfo).to.have.been.calledWith('user-id-123');
      expect(result).to.not.be.null;
      expect(result?.user).to.deep.equal(refreshedUser);
    });

    it('should not refresh user info for application clients', async () => {
      const mockUser = { _id: 'client-id-123', role: 'internal-client', globalLogoutAt: null, scope: ['read'] };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read']
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(oauthUtilsStub.isApplicationClient).to.have.been.calledWith(mockUser);
      expect(oauthCacheStub.getUserInfo).to.not.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.user).to.deep.equal(mockUser);
    });

    it('should return null if scope has been revoked', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null,
        scope: ['read'] 
      };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read', 'write'] 
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(oauthUtilsStub.validateAccessTokenScopes).to.have.been.called;
      expect(result).to.be.null;
    });

    it('should return null if token is invalidated', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: '2025-01-02T00:00:00.000Z', 
        scope: ['read']
      };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read']
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(true); 

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(sessionUtilsStub.isTokenInvalidated).to.have.been.calledWith(
        mockUser.globalLogoutAt, 
        '2025-01-01T00:00:00.000Z'
      );
      expect(result).to.be.null;
    });

    it('should return null if scope has been revoked', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null,
        scope: ['read']
      };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read', 'write'] 
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(result).to.be.null;
    });

    it('should return token with parsed dates if all validations pass', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null,
        scope: ['read', 'write']
      };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        accessTokenExpiresAt: '2025-12-31T23:59:59.000Z',
        refreshTokenExpiresAt: '2026-01-31T23:59:59.000Z',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read', 'write']
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(result).to.not.be.null;
      expect(result?.accessTokenExpiresAt).to.be.instanceof(Date);
      expect(result?.refreshTokenExpiresAt).to.be.instanceof(Date);
      expect(result?.accessTokenExpiresAt.toISOString()).to.equal('2025-12-31T23:59:59.000Z');
      expect(result?.refreshTokenExpiresAt.toISOString()).to.equal('2026-01-31T23:59:59.000Z');
      expect(result?.user).to.deep.equal(mockUser);
    });

    it('should dynamically recalculate scopes for internal client on refresh token check', async () => {
      const mockUser = {
        _id: 'user-id-123',
        role: 'admin-user',
        globalLogoutAt: null,
        scope: ['custom:scope']
      };
      const mockTokenString = JSON.stringify({
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'internal-client-123', role: 'internal_client' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['old:scope']
      });

      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(mockUser);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      oauthUtilsStub.recalculateRefreshTokenScopes.returns(['custom:scope', 'admin:read', 'admin:write']);

      const result = await RedisAdapter.checkToken(mockTokenString, true);

      expect(oauthUtilsStub.recalculateRefreshTokenScopes).to.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.scope).to.deep.equal(['custom:scope', 'admin:read', 'admin:write']);
    });

    it('should prune revoked scopes for external client on refresh token check', async () => {
      const mockUser = {
        _id: 'user-id-123',
        role: 'regular-user',
        globalLogoutAt: null,
        scope: ['read']
      };
      const mockTokenString = JSON.stringify({
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'external-client-123', role: 'external_client' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read', 'write', 'admin']
      });

      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(mockUser);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      oauthUtilsStub.recalculateRefreshTokenScopes.returns(['read']);

      const result = await RedisAdapter.checkToken(mockTokenString, true);

      expect(oauthUtilsStub.recalculateRefreshTokenScopes).to.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.scope).to.deep.equal(['read']);
    });

    it('should return null on refresh token check if global logout occurred', async () => {
      const mockUser = {
        _id: 'user-id-123',
        role: 'regular-user',
        globalLogoutAt: '2025-01-02T00:00:00.000Z',
        scope: ['read']
      };
      const mockTokenString = JSON.stringify({
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'client-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read']
      });

      oauthUtilsStub.isApplicationClient.returns(true);
      sessionUtilsStub.isTokenInvalidated.returns(true);

      const result = await RedisAdapter.checkToken(mockTokenString, true);

      expect(result).to.be.null;
    });
  });

  describe('getAccessToken', () => {
    it('should get access token from Redis and return validated token', async () => {
      const accessToken = 'access-token-123';
      const mockTokenString = JSON.stringify({
        accessToken,
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' },
        scope: ['read']
      });

      sandbox.stub(Redis, 'get').resolves(mockTokenString);
      sandbox.stub(RedisAdapter, 'checkToken').resolves({ accessToken } as any);

      const result = await RedisAdapter.getAccessToken(accessToken);

      expect(Redis.get).to.have.been.calledWith(`${RedisPrefixes.TOKEN}${accessToken}`);
      expect(RedisAdapter.checkToken).to.have.been.calledWith(mockTokenString);
      expect(result?.accessToken).to.equal(accessToken);
    });

    it('should return null if token not found in Redis', async () => {
      const accessToken = 'non-existent-token';

      sandbox.stub(Redis, 'get').resolves(null);
      sandbox.stub(RedisAdapter, 'checkToken').resolves(null);

      const result = await RedisAdapter.getAccessToken(accessToken);

      expect(result).to.be.null;
    });
  });

  describe('getRefreshToken', () => {
    it('should get refresh token from Redis and return validated token', async () => {
      const refreshToken = 'refresh-token-123';
      const mockTokenString = JSON.stringify({
        refreshToken,
        accessToken: 'access-token-123',
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' },
        scope: ['read']
      });

      sandbox.stub(Redis, 'get').resolves(mockTokenString);
      sandbox.stub(RedisAdapter, 'checkToken').resolves({ refreshToken } as any);

      const result = await RedisAdapter.getRefreshToken(refreshToken);

      expect(Redis.get).to.have.been.calledWith(`${RedisPrefixes.TOKEN}${refreshToken}`);
      expect(RedisAdapter.checkToken).to.have.been.calledWith(mockTokenString);
      expect(result?.refreshToken).to.equal(refreshToken);
    });
  });

  describe('revokeToken', () => {
    it('should delete both access and refresh tokens from Redis', async () => {
      const mockToken = {
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123',
        refreshTokenExpiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' }
      };

      const delStub = sandbox.stub(Redis, 'del').resolves(1);

      const result = await RedisAdapter.revokeToken(mockToken as any);

      expect(delStub).to.have.been.calledTwice;
      expect(delStub.firstCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.refreshToken}`);
      expect(delStub.secondCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.accessToken}`);
      expect(result).to.be.true;
    });

    it('should delete only access token when refresh token is not present', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        refreshTokenExpiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' }
      };

      const delStub = sandbox.stub(Redis, 'del').resolves(1);

      const result = await RedisAdapter.revokeToken(mockToken as any);

      expect(delStub).to.have.been.calledOnce;
      expect(delStub.firstCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.accessToken}`);
      expect(result).to.be.true;
    });

    it('should return true even if no tokens to delete', async () => {
      const mockToken = {
        refreshTokenExpiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' }
      };

      const delStub = sandbox.stub(Redis, 'del').resolves(0);

      const result = await RedisAdapter.revokeToken(mockToken as any);

      expect(delStub).to.not.have.been.called;
      expect(result).to.be.true;
    });
  });

  describe('saveAuthorizationCode', () => {
    it('should save authorization code to Redis with expiration', async () => {
      const mockAuthCode = {
        authorizationCode: 'auth-code-123',
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        redirectUri: 'https://example.com/callback',
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' },
        scope: ['read']
      };

      sandbox.stub(Configuration, 'get')
        .withArgs('oauth.authorization-code-lifetime').returns(600);

      const setExStub = sandbox.stub(Redis, 'setEx').resolves();

      const result = await RedisAdapter.saveAuthorizationCode(mockAuthCode as any);

      expect(setExStub).to.have.been.calledOnce;
      expect(setExStub.firstCall.args[0]).to.equal(`${RedisPrefixes.CODE}${mockAuthCode.authorizationCode}`);
      expect(setExStub.firstCall.args[1]).to.equal(JSON.stringify(mockAuthCode));
      expect(setExStub.firstCall.args[2]).to.equal(600);
      expect(result).to.deep.equal(mockAuthCode);
    });
  });

  describe('getAuthorizationCode', () => {
    it('should get authorization code from Redis and parse dates', async () => {
      const authCode = 'auth-code-123';
      const mockCodeString = JSON.stringify({
        authorizationCode: authCode,
        expiresAt: '2025-12-31T23:59:59Z',
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123' },
        scope: ['read']
      });

      sandbox.stub(Redis, 'get').resolves(mockCodeString);

      const result = await RedisAdapter.getAuthorizationCode(authCode);

      expect(Redis.get).to.have.been.calledWith(`${RedisPrefixes.CODE}${authCode}`);
      expect(result?.authorizationCode).to.equal(authCode);
      expect(result?.expiresAt).to.be.instanceof(Date);
    });

    it('should return null if authorization code not found', async () => {
      const authCode = 'non-existent-code';

      sandbox.stub(Redis, 'get').resolves(null);

      const result = await RedisAdapter.getAuthorizationCode(authCode);

      expect(result).to.be.null;
    });
  });

  describe('revokeAuthorizationCode', () => {
    it('should delete authorization code from Redis and return true', async () => {
      const authCode = 'auth-code-123';

      const delStub = sandbox.stub(Redis, 'del').resolves(1);

      const result = await RedisAdapter.revokeAuthorizationCode(authCode);

      expect(delStub).to.have.been.calledWith(`${RedisPrefixes.CODE}${authCode}`);
      expect(result).to.be.true;
    });
  });
});
