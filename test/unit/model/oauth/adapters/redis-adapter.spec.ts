import { expect } from 'chai';
import sinon from 'sinon';
import RedisAdapter from '../../../../../src/model/oauth/adapters/redis-adapter.js';
import { Redis } from '../../../../../src/singleton/redis.js';
import { RedisPrefixes } from '../../../../../src/enum/redis.js';
import { Configuration } from '../../../../../src/singleton/configuration.js';
import { ScopeManager } from '../../../../../src/singleton/scope-manager.js';
import { Role } from '../../../../../src/singleton/role.js';
import * as oauthUtils from '../../../../../src/model/oauth/utils.js';
import * as oauthCache from '../../../../../src/model/oauth/cache.js';
import * as sessionUtils from '../../../../../src/utils/session.js';
import * as roleUtils from '../../../../../src/utils/role.js';

describe('RedisAdapter', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
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

    it.skip('should refresh user info for non-application clients', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup
      // The test would verify that getUserInfo is called for non-application clients
    });

    it.skip('should return null if role is invalidated', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup
      // The test would verify that null is returned when role is invalidated
    });

    it.skip('should return null if token is invalidated', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup
      // The test would verify that null is returned when token is invalidated
    });

    it.skip('should return null if scope has been revoked', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup  
      // The test would verify that null is returned when scope has been revoked
    });

    it.skip('should return token with parsed dates if all validations pass', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup
      // The test would verify that the token is returned with parsed dates when all validations pass
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
