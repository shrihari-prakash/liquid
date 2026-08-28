import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import TokenModel from '../../../../../src/model/mongo/token.js';
import AuthorizationCodeModel from '../../../../../src/model/mongo/authorization-code.js';
import ClientModel from '../../../../../src/model/mongo/client.js';

import { Role } from '../../../../../src/singleton/role.js';
import { ScopeManager } from '../../../../../src/singleton/scope-manager.js';

describe('MongoAdapter', () => {
  let sandbox: sinon.SinonSandbox;
  let MongoAdapter: any;
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
    
    roleUtilsStub = {
      isRoleInvalidated: sandbox.stub()
    };

    roleSingletonStub = {
      SystemRoles: {
        SUPER_ADMIN: "super_admin",
        ADMIN: "admin",
        USER: "user",
        INTERNAL_CLIENT: "internal_client",
        EXTERNAL_CLIENT: "external_client",
      },
      getRole: sandbox.stub(),
      getRoleScopes: sandbox.stub().returns([]),
    };

    scopeManagerSingletonStub = {
      isScopeAllowed: sandbox.stub(),
    };
    
    // Use esmock to load MongoAdapter with stubbed dependencies
    MongoAdapter = await esmock('../../../../../src/model/oauth/adapters/mongo-adapter.js', {
      '../../../../../src/model/oauth/utils.js': oauthUtilsStub,
      '../../../../../src/model/oauth/cache.js': oauthCacheStub,
      '../../../../../src/utils/session.js': sessionUtilsStub,
      '../../../../../src/utils/role.js': roleUtilsStub,
      '../../../../../src/singleton/role.js': { Role: roleSingletonStub },
      '../../../../../src/singleton/scope-manager.js': { ScopeManager: scopeManagerSingletonStub }
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('saveToken', () => {
    it('should save token to database and return it', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        accessTokenExpiresAt: new Date('2025-12-31T23:59:59Z'),
        refreshTokenExpiresAt: new Date('2026-01-31T23:59:59Z'),
        user: { _id: 'user-id-123', username: 'testuser' },
        client: { id: 'client-id-123', grants: ['authorization_code', 'refresh_token'] },
        scope: ['read', 'write']
      };

      const saveStub = sandbox.stub().resolves();
      const toObjectStub = sandbox.stub().returns(mockToken);
      const tokenInstanceMock = {
        save: saveStub,
        toObject: toObjectStub
      };

      sandbox.stub(TokenModel.prototype, 'save').callsFake(saveStub);
      sandbox.stub(TokenModel.prototype, 'toObject').callsFake(toObjectStub);

      const result = await MongoAdapter.saveToken(mockToken as any);

      expect(result).to.deep.equal(mockToken);
    });
  });

  describe('checkToken', () => {
    it('should return null if token is null or undefined', async () => {
      const result = await MongoAdapter.checkToken(null as any);
      expect(result).to.be.null;

      const result2 = await MongoAdapter.checkToken(undefined as any);
      expect(result2).to.be.null;
    });

    it('should refresh user info for non-application clients', async () => {
      const originalUser = { _id: 'user-id-123', role: 'regular-user' };
      const mockToken = {
        accessToken: 'access-token-123',
        user: originalUser,
        client: { id: 'client-id-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z')
      };

      const refreshedUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null 
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(refreshedUser);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await MongoAdapter.checkToken(mockToken as any);

      expect(oauthUtilsStub.isApplicationClient).to.have.been.calledWith(originalUser);
      expect(oauthCacheStub.getUserInfo).to.have.been.calledWith('user-id-123');
      expect(result).to.not.be.null;
      expect(result?.user).to.deep.equal(refreshedUser);
    });

    it('should not refresh user info for application clients', async () => {
      const mockUser = { _id: 'client-id-123', role: 'internal-client', globalLogoutAt: null };
      const mockToken = {
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z')
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await MongoAdapter.checkToken(mockToken as any);

      expect(oauthUtilsStub.isApplicationClient).to.have.been.calledWith(mockUser);
      expect(oauthCacheStub.getUserInfo).to.not.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.user).to.deep.equal(mockUser);
    });

    it('should return null if role is invalidated', async () => {
      const mockUser = { 
        _id: 'user-id-123', 
        role: 'regular-user',
        globalLogoutAt: null 
      };
      const mockToken = {
        accessToken: 'access-token-123',
        user: mockUser,
        client: { id: 'client-id-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z')
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(false);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await MongoAdapter.checkToken(mockToken as any);

      expect(oauthUtilsStub.validateAccessTokenScopes).to.have.been.called;
      expect(result).to.be.null;
    });

    it('should return null if token is invalidated', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        user: { 
          _id: 'user-id-123', 
          role: 'regular-user',
          globalLogoutAt: '2025-01-02T00:00:00Z' // Global logout after token registration
        },
        client: { id: 'client-id-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z')
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(true); // Token is invalidated

      const result = await MongoAdapter.checkToken(mockToken as any);

      expect(sessionUtilsStub.isTokenInvalidated).to.have.been.calledWith(
        mockToken.user.globalLogoutAt, 
        mockToken.registeredAt
      );
      expect(result).to.be.null;
    });

    it('should return token if all validations pass', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        user: { 
          _id: 'user-id-123', 
          role: 'regular-user',
          globalLogoutAt: null 
        },
        client: { id: 'client-id-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z')
      };

      // Setup stubs
      oauthUtilsStub.isApplicationClient.returns(true);
      oauthUtilsStub.validateAccessTokenScopes.resolves(true);
      sessionUtilsStub.isTokenInvalidated.returns(false);

      const result = await MongoAdapter.checkToken(mockToken as any);

      expect(result).to.deep.equal(mockToken);
    });

    it('should dynamically recalculate scopes for internal client on refresh token check', async () => {
      const mockUser = {
        _id: 'user-id-123',
        role: 'admin-user',
        globalLogoutAt: null,
        scope: ['custom:scope']
      };
      const mockToken = {
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'internal-client-123', role: 'internal_client' },
        registeredAt: new Date('2025-01-01T00:00:00Z'),
        scope: ['old:scope']
      };

      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(mockUser);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      oauthUtilsStub.recalculateRefreshTokenScopes.returns(['custom:scope', 'admin:read', 'admin:write']);

      const result = await MongoAdapter.checkToken(mockToken as any, true);

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
      const mockToken = {
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'external-client-123', role: 'external_client' },
        registeredAt: new Date('2025-01-01T00:00:00Z'),
        scope: ['read', 'write', 'admin']
      };

      oauthUtilsStub.isApplicationClient.returns(false);
      oauthCacheStub.getUserInfo.resolves(mockUser);
      sessionUtilsStub.isTokenInvalidated.returns(false);
      oauthUtilsStub.recalculateRefreshTokenScopes.returns(['read']);

      const result = await MongoAdapter.checkToken(mockToken as any, true);

      expect(oauthUtilsStub.recalculateRefreshTokenScopes).to.have.been.called;
      expect(result).to.not.be.null;
      expect(result?.scope).to.deep.equal(['read']);
    });

    it('should return null on refresh token check if global logout occurred', async () => {
      const mockUser = {
        _id: 'user-id-123',
        role: 'regular-user',
        globalLogoutAt: '2025-01-02T00:00:00Z',
        scope: ['read']
      };
      const mockToken = {
        refreshToken: 'refresh-token-123',
        user: mockUser,
        client: { id: 'client-123' },
        registeredAt: new Date('2025-01-01T00:00:00Z'),
        scope: ['read']
      };

      oauthUtilsStub.isApplicationClient.returns(true);
      sessionUtilsStub.isTokenInvalidated.returns(true);

      const result = await MongoAdapter.checkToken(mockToken as any, true);

      expect(result).to.be.null;
    });
  });

  describe('getAccessToken', () => {
    it('should find access token and return validated token', async () => {
      const accessToken = 'access-token-123';
      const mockDbToken = {
        accessToken,
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const findOneStub = sandbox.stub(TokenModel, 'findOne').returns({
        lean: () => Promise.resolve(mockDbToken)
      } as any);
      sandbox.stub(MongoAdapter, 'checkToken').resolves(mockDbToken as any);

      const result = await MongoAdapter.getAccessToken(accessToken);

      expect(findOneStub).to.have.been.calledWith({ accessToken });
      expect(MongoAdapter.checkToken).to.have.been.calledWith(mockDbToken);
      expect(result).to.deep.equal(mockDbToken);
    });

    it('should return null if token not found', async () => {
      const accessToken = 'non-existent-token';

      sandbox.stub(TokenModel, 'findOne').returns({
        lean: () => Promise.resolve(null)
      } as any);
      sandbox.stub(MongoAdapter, 'checkToken').resolves(null);

      const result = await MongoAdapter.getAccessToken(accessToken);

      expect(result).to.be.null;
    });
  });

  describe('getRefreshToken', () => {
    it('should find refresh token and return validated token', async () => {
      const refreshToken = 'refresh-token-123';
      const mockDbToken = {
        refreshToken,
        accessToken: 'access-token-123',
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const findOneStub = sandbox.stub(TokenModel, 'findOne').returns({
        lean: () => Promise.resolve(mockDbToken)
      } as any);
      sandbox.stub(MongoAdapter, 'checkToken').resolves(mockDbToken as any);

      const result = await MongoAdapter.getRefreshToken(refreshToken);

      expect(findOneStub).to.have.been.calledWith({ refreshToken });
      expect(MongoAdapter.checkToken).to.have.been.calledWith(mockDbToken);
      expect(result).to.deep.equal(mockDbToken);
    });
  });

  describe('revokeToken', () => {
    it('should delete token by refresh token and return true', async () => {
      const mockToken = {
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123',
        refreshTokenExpiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const deleteOneStub = sandbox.stub(TokenModel, 'deleteOne').returns({
        exec: () => Promise.resolve({ deletedCount: 1 })
      } as any);

      const result = await MongoAdapter.revokeToken(mockToken as any);

      expect(deleteOneStub).to.have.been.calledWith({
        refreshToken: mockToken.refreshToken
      });
      expect(result).to.be.true;
    });

    it('should return true even if refresh token is undefined', async () => {
      const mockToken = {
        refreshToken: undefined,
        accessToken: 'access-token-123',
        refreshTokenExpiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const result = await MongoAdapter.revokeToken(mockToken as any);

      expect(result).to.be.true;
    });
  });

  describe('saveAuthorizationCode', () => {
    it('should save authorization code and return it', async () => {
      const mockAuthCode = {
        authorizationCode: 'auth-code-123',
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        redirectUri: 'https://example.com/callback',
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] },
        scope: ['read']
      };

      const mockSavedCode = { ...mockAuthCode, _id: 'db-id-123' };
      const mockCodeInstance = {
        save: sandbox.stub().resolves({ toObject: () => mockSavedCode }),
        toObject: sandbox.stub().returns(mockSavedCode)
      };

      sandbox.stub(AuthorizationCodeModel.prototype, 'save').resolves(mockCodeInstance);
      sandbox.stub(AuthorizationCodeModel.prototype, 'toObject').returns(mockSavedCode);

      const result = await MongoAdapter.saveAuthorizationCode(mockAuthCode as any);

      expect(result).to.deep.equal(mockSavedCode);
    });
  });

  describe('getAuthorizationCode', () => {
    it('should find and return authorization code', async () => {
      const authCode = 'auth-code-123';
      const mockDbCode = {
        authorizationCode: authCode,
        expiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const findOneStub = sandbox.stub(AuthorizationCodeModel, 'findOne').returns({
        lean: () => Promise.resolve(mockDbCode)
      } as any);

      const result = await MongoAdapter.getAuthorizationCode(authCode);

      expect(findOneStub).to.have.been.calledWith({
        authorizationCode: authCode
      });
      expect(result).to.deep.equal(mockDbCode);
    });
  });

  describe('revokeAuthorizationCode', () => {
    it('should delete authorization code and return true', async () => {
      const mockAuthCode = {
        authorizationCode: 'auth-code-123',
        expiresAt: new Date(),
        user: { _id: 'user-id-123' },
        client: { id: 'client-id-123', grants: ['authorization_code'] }
      };

      const deleteOneStub = sandbox.stub(AuthorizationCodeModel, 'deleteOne').returns({
        exec: () => Promise.resolve({ deletedCount: 1 })
      } as any);

      const result = await MongoAdapter.revokeAuthorizationCode(mockAuthCode as any);

      expect(deleteOneStub).to.have.been.calledWith({
        authorizationCode: mockAuthCode
      });
      expect(result).to.be.true;
    });
  });

  describe('getClient', () => {
    it('should find confidential client with matching clientSecret', async () => {
      const clientId = 'client-id-123';
      const clientSecret = 'client-secret-456';
      const mockClient = {
        id: clientId,
        secret: clientSecret,
        isPublic: false,
        name: 'Test Client',
        grants: ['authorization_code', 'refresh_token']
      };

      const findOneStub = sandbox.stub(ClientModel, 'findOne').returns({
        lean: () => Promise.resolve(mockClient)
      } as any);

      const result = await MongoAdapter.getClient(clientId, clientSecret);

      expect(findOneStub).to.have.been.calledWith({ id: clientId });
      expect(result).to.deep.equal(mockClient);
    });

    it('should return null for confidential client when clientSecret is not provided or invalid', async () => {
      const clientId = 'client-id-123';
      const mockClient = {
        id: clientId,
        secret: 'correct-secret',
        isPublic: false,
        name: 'Test Client',
        grants: ['authorization_code']
      };

      sandbox.stub(ClientModel, 'findOne').returns({
        lean: () => Promise.resolve(mockClient)
      } as any);

      const resultNoSecret = await MongoAdapter.getClient(clientId, '');
      const resultWrongSecret = await MongoAdapter.getClient(clientId, 'wrong-secret');

      expect(resultNoSecret).to.be.null;
      expect(resultWrongSecret).to.be.null;
    });

    it('should find public client without clientSecret when isPublic is true', async () => {
      const clientId = 'public-client-123';
      const mockClient = {
        id: clientId,
        isPublic: true,
        name: 'Public SPA Client',
        grants: ['authorization_code']
      };

      sandbox.stub(ClientModel, 'findOne').returns({
        lean: () => Promise.resolve(mockClient)
      } as any);

      const result = await MongoAdapter.getClient(clientId, '');

      expect(result).to.deep.equal(mockClient);
    });

    it('should handle errors and re-throw them', async () => {
      const clientId = 'client-id-123';
      const clientSecret = 'client-secret-456';
      const error = new Error('Database connection failed');

      sandbox.stub(ClientModel, 'findOne').throws(error);

      try {
        await MongoAdapter.getClient(clientId, clientSecret);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
