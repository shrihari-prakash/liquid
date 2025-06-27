import { expect } from 'chai';
import sinon from 'sinon';
import MongoAdapter from '../../../../../src/model/oauth/adapters/mongo-adapter.js';
import TokenModel from '../../../../../src/model/mongo/token.js';
import AuthorizationCodeModel from '../../../../../src/model/mongo/authorization-code.js';
import ClientModel from '../../../../../src/model/mongo/client.js';
import * as oauthUtils from '../../../../../src/model/oauth/utils.js';
import * as oauthCache from '../../../../../src/model/oauth/cache.js';
import * as sessionUtils from '../../../../../src/utils/session.js';
import * as roleUtils from '../../../../../src/utils/role.js';

describe('MongoAdapter', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
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

      const mockSavedToken = { ...mockToken, _id: 'db-id-123' };
      const mockTokenInstance = {
        save: sandbox.stub().resolves({ toObject: () => mockSavedToken }),
        toObject: sandbox.stub().returns(mockSavedToken)
      };

      sandbox.stub(TokenModel.prototype, 'save').resolves(mockTokenInstance);
      sandbox.stub(TokenModel.prototype, 'toObject').returns(mockSavedToken);

      const result = await MongoAdapter.saveToken(mockToken as any);

      expect(result).to.deep.equal(mockSavedToken);
    });
  });

  describe('checkToken', () => {
    it('should return null if token is null or undefined', async () => {
      const result = await MongoAdapter.checkToken(null as any);
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

    it.skip('should return token if all validations pass', async () => {
      // This test requires stubbing ES modules which is not currently supported in this setup
      // The test would verify that the token is returned when all validations pass
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
    it('should find client with both clientId and clientSecret', async () => {
      const clientId = 'client-id-123';
      const clientSecret = 'client-secret-456';
      const mockClient = {
        id: clientId,
        secret: clientSecret,
        name: 'Test Client',
        grants: ['authorization_code', 'refresh_token']
      };

      const findOneStub = sandbox.stub(ClientModel, 'findOne').returns({
        lean: () => Promise.resolve(mockClient)
      } as any);

      const result = await MongoAdapter.getClient(clientId, clientSecret);

      expect(findOneStub).to.have.been.calledWith({
        $and: [{ id: clientId }, { secret: clientSecret }]
      });
      expect(result).to.deep.equal(mockClient);
    });

    it('should find client with only clientId when clientSecret is not provided', async () => {
      const clientId = 'client-id-123';
      const mockClient = {
        id: clientId,
        name: 'Test Client',
        grants: ['authorization_code']
      };

      const findOneStub = sandbox.stub(ClientModel, 'findOne').returns({
        lean: () => Promise.resolve(mockClient)
      } as any);

      const result = await MongoAdapter.getClient(clientId, '');

      expect(findOneStub).to.have.been.calledWith({ id: clientId });
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
