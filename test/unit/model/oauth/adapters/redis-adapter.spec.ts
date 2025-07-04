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

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    
    // Create stubs for the utility modules
    oauthUtilsStub = {
      isApplicationClient: sandbox.stub()
    };
    
    oauthCacheStub = {
      getUserInfo: sandbox.stub()
    };
    
    sessionUtilsStub = {
      isTokenInvalidated: sandbox.stub()
    };
    
    roleUtilsStub = {
      isRoleInvalidated: sandbox.stub()
    };
    
    // Use esmock to load RedisAdapter with stubbed dependencies
    RedisAdapter = await esmock('../../../../../src/model/oauth/adapters/redis-adapter.js', {
      '../../../../../src/model/oauth/utils.js': oauthUtilsStub,
      '../../../../../src/model/oauth/cache.js': oauthCacheStub,
      '../../../../../src/utils/session.js': sessionUtilsStub,
      '../../../../../src/utils/role.js': roleUtilsStub
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
    it('should save access token to Redis with expiration', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        accessTokenExpiresAt: new Date('2025-12-31T23:59:59Z'),
        refreshTokenExpiresAt: new Date('2026-01-31T23:59:59Z'),
        user: { _id: 'user-id-123', username: 'testuser' },
        client: { id: 'client-id-123', grants: ['authorization_code', 'refresh_token'] },
        scope: ['read', 'write']
      };

      sandbox.stub(Configuration, 'get')
        .withArgs('oauth.access-token-lifetime').returns(3600)
        .withArgs('oauth.refresh-token-lifetime').returns(86400);

      const setExStub = sandbox.stub(Redis, 'setEx').resolves();
      sandbox.useFakeTimers(new Date('2025-01-01T00:00:00Z'));

      const result = await RedisAdapter.saveToken(mockToken as any);

      expect(setExStub).to.have.been.calledTwice;
      expect(setExStub.firstCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.accessToken}`);
      expect(setExStub.firstCall.args[2]).to.equal(3600);
      expect(setExStub.secondCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.refreshToken}`);
      expect(setExStub.secondCall.args[2]).to.equal(86400);
      
      expect(result.registeredAt).to.equal('2025-01-01T00:00:00.000Z');
      expect(result).to.deep.include(mockToken);
    });

    it('should save only access token when refresh token is not present', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        accessTokenExpiresAt: new Date('2025-12-31T23:59:59Z'),
        user: { _id: 'user-id-123', username: 'testuser' },
        client: { id: 'client-id-123', grants: ['authorization_code'] },
        scope: ['read']
      };

      sandbox.stub(Configuration, 'get')
        .withArgs('oauth.access-token-lifetime').returns(3600);

      const setExStub = sandbox.stub(Redis, 'setEx').resolves();

      const result = await RedisAdapter.saveToken(mockToken as any);

      expect(setExStub).to.have.been.calledOnce;
      expect(setExStub.firstCall.args[0]).to.equal(`${RedisPrefixes.TOKEN}${mockToken.accessToken}`);
      expect(result).to.deep.include(mockToken);
    });
  });

  describe('checkToken', () => {
    it('should return null if token is null or undefined', async () => {
      const result = await RedisAdapter.checkToken(null);
      expect(result).to.be.null;
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
      roleUtilsStub.isRoleInvalidated.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      
      // Mock Role and ScopeManager
      sandbox.stub(Role, 'getRole').returns({ 
        id: 'regular-user',
        displayName: 'Regular User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read', 'write', 'admin'] 
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').returns(true);

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
      roleUtilsStub.isRoleInvalidated.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      
      // Mock Role and ScopeManager
      sandbox.stub(Role, 'getRole').returns({ 
        id: 'internal-client',
        displayName: 'Internal Client',
        ranking: 1,
        type: 'client' as const,
        scope: ['read', 'write'] 
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').returns(true);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(oauthUtilsStub.isApplicationClient).to.have.been.calledWith(mockUser);
      expect(oauthCacheStub.getUserInfo).to.not.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.user).to.deep.equal(mockUser);
    });

    it('should return null if role is invalidated', async () => {
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
        scope: ['read']
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      roleUtilsStub.isRoleInvalidated.resolves(true); // Role is invalidated
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(roleUtilsStub.isRoleInvalidated).to.have.been.calledWith(
        mockUser.role, 
        '2025-01-01T00:00:00.000Z'
      );
      expect(result).to.be.null;
    });

    it('should return null if token is invalidated', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: '2025-01-02T00:00:00.000Z', // Global logout after token registration
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
      roleUtilsStub.isRoleInvalidated.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(true); // Token is invalidated
      
      // Mock Role and ScopeManager
      sandbox.stub(Role, 'getRole').returns({ 
        id: 'regular-user',
        displayName: 'Regular User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read', 'write'] 
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').returns(true);

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
        scope: ['read'] // User only has read scope
      };
      const mockTokenString = JSON.stringify({
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: '2025-01-01T00:00:00.000Z',
        scope: ['read', 'write'] // Token has both read and write scopes
      });

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      roleUtilsStub.isRoleInvalidated.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      
      // Mock Role and ScopeManager - simulate that write scope is not allowed
      sandbox.stub(Role, 'getRole').returns({ 
        id: 'regular-user',
        displayName: 'Regular User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read'] 
      }); // Role only allows read
      const scopeStub = sandbox.stub(ScopeManager, 'isScopeAllowed');
      scopeStub.withArgs('read', ['read']).returns(true); // Read scope is allowed
      scopeStub.withArgs('write', ['read']).returns(false); // Write scope is not allowed for role
      scopeStub.withArgs('write', ['read']).returns(false); // Write scope is not allowed for user

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
      roleUtilsStub.isRoleInvalidated.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      
      // Mock Role and ScopeManager
      sandbox.stub(Role, 'getRole').returns({ 
        id: 'regular-user',
        displayName: 'Regular User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read', 'write', 'admin'] 
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').returns(true);

      const result = await RedisAdapter.checkToken(mockTokenString);

      expect(result).to.not.be.null;
      expect(result?.accessTokenExpiresAt).to.be.instanceof(Date);
      expect(result?.refreshTokenExpiresAt).to.be.instanceof(Date);
      expect(result?.accessTokenExpiresAt.toISOString()).to.equal('2025-12-31T23:59:59.000Z');
      expect(result?.refreshTokenExpiresAt.toISOString()).to.equal('2026-01-31T23:59:59.000Z');
      expect(result?.user).to.deep.equal(mockUser);
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
