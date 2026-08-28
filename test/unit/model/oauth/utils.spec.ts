import { expect } from 'chai';
import sinon from 'sinon';
import esmock from 'esmock';
import { Role } from '../../../../src/singleton/role.js';
import { ScopeManager } from '../../../../src/singleton/scope-manager.js';
import { Configuration } from '../../../../src/singleton/configuration.js';

describe('OAuth Utils', () => {
  let sandbox: sinon.SinonSandbox;
  let isRoleInvalidatedStub: sinon.SinonStub;
  let oauthUtils: any;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    isRoleInvalidatedStub = sandbox.stub().resolves(false);
    oauthUtils = await esmock('../../../../src/model/oauth/utils.js', {
      '../../../../src/utils/role.js': {
        isRoleInvalidated: isRoleInvalidatedStub
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isApplicationClient', () => {
    it('should return true for internal client role', () => {
      const user = { role: Role.SystemRoles.INTERNAL_CLIENT };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.true;
    });

    it('should return true for external client role', () => {
      const user = { role: Role.SystemRoles.EXTERNAL_CLIENT };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.true;
    });

    it('should return false for user role', () => {
      const user = { role: Role.SystemRoles.USER };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for admin role', () => {
      const user = { role: Role.SystemRoles.ADMIN };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for super admin role', () => {
      const user = { role: Role.SystemRoles.SUPER_ADMIN };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for undefined role', () => {
      const user = { role: undefined };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for null role', () => {
      const user = { role: null };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for custom role', () => {
      const user = { role: 'custom_role' };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user without role property', () => {
      const user = {};
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle null user', () => {
      const result = oauthUtils.isApplicationClient(null);
      expect(result).to.be.false;
    });

    it('should handle undefined user', () => {
      const result = oauthUtils.isApplicationClient(undefined);
      expect(result).to.be.false;
    });

    it('should handle user with empty string role', () => {
      const user = { role: '' };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user with number role', () => {
      const user = { role: 123 };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user with boolean role', () => {
      const user = { role: true };
      const result = oauthUtils.isApplicationClient(user);
      expect(result).to.be.false;
    });
  });

  describe('validateAccessTokenScopes', () => {
    it('should return false if role is invalidated', async () => {
      isRoleInvalidatedStub.resolves(true);
      const user = { role: 'admin-user', username: 'admin' };
      const token = { scope: ['admin:read'] };

      const result = await oauthUtils.validateAccessTokenScopes(token, user, new Date());
      expect(result).to.be.false;
    });

    it('should return false if scope has been revoked', async () => {
      isRoleInvalidatedStub.resolves(false);
      sandbox.stub(Role, 'getRole').returns({
        id: 'user',
        displayName: 'User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read']
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').callsFake((scope: string, allowed: string[] = []) => {
        return allowed.includes(scope);
      });

      const user = { role: 'user', scope: ['read'], username: 'testuser' };
      const token = { scope: ['read', 'revoked_scope'] };

      const result = await oauthUtils.validateAccessTokenScopes(token, user, new Date());
      expect(result).to.be.false;
    });

    it('should return true if all scopes are allowed', async () => {
      isRoleInvalidatedStub.resolves(false);
      sandbox.stub(Role, 'getRole').returns({
        id: 'user',
        displayName: 'User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read']
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').callsFake((scope: string, allowed: string[] = []) => {
        return allowed.includes(scope);
      });

      const user = { role: 'user', scope: ['write'], username: 'testuser' };
      const token = { scope: ['read', 'write'] };

      const result = await oauthUtils.validateAccessTokenScopes(token, user, new Date());
      expect(result).to.be.true;
    });

    it('should return true if token scope is empty', async () => {
      isRoleInvalidatedStub.resolves(false);
      const user = { role: 'user', scope: [], username: 'testuser' };
      const token = { scope: [] };

      const result = await oauthUtils.validateAccessTokenScopes(token, user);
      expect(result).to.be.true;
    });
  });

  describe('recalculateRefreshTokenScopes', () => {
    it('should fallback to default scope if user.scope is not defined', () => {
      sandbox.stub(Configuration, 'get').withArgs('user.account-creation.default-scope').returns(['default:scope']);
      sandbox.stub(Role, 'getRoleScopes').returns(['role:scope']);

      const user: any = { role: 'user', username: 'testuser' };
      const client = { role: Role.SystemRoles.INTERNAL_CLIENT };
      const token = { scope: ['old:scope'] };

      const result = oauthUtils.recalculateRefreshTokenScopes(token, user, client);
      expect(result).to.deep.equal(['default:scope', 'role:scope']);
      expect(user.scope).to.deep.equal(['default:scope']);
    });

    it('should combine user and role scopes for internal client', () => {
      sandbox.stub(Role, 'getRoleScopes').withArgs('admin-role').returns(['admin:read', 'admin:write']);

      const user = { role: 'admin-role', scope: ['custom:scope'], username: 'admin' };
      const client = { role: Role.SystemRoles.INTERNAL_CLIENT };
      const token = { scope: ['old:scope'] };

      const result = oauthUtils.recalculateRefreshTokenScopes(token, user, client);
      expect(result).to.deep.equal(['custom:scope', 'admin:read', 'admin:write']);
    });

    it('should prune revoked scopes for external client', () => {
      sandbox.stub(Role, 'getRole').returns({
        id: 'user',
        displayName: 'User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read']
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').callsFake((scope: string, allowed: string[] = []) => {
        return allowed.includes(scope);
      });

      const user = { role: 'user', scope: ['write'], username: 'testuser' };
      const client = { role: Role.SystemRoles.EXTERNAL_CLIENT, scope: ['read', 'write', 'external'] };
      const token = { scope: ['read', 'write', 'revoked'] };

      const result = oauthUtils.recalculateRefreshTokenScopes(token, user, client);
      expect(result).to.deep.equal(['read', 'write']);
    });

    it('should filter scopes not allowed by client', () => {
      sandbox.stub(Role, 'getRole').returns({
        id: 'user',
        displayName: 'User',
        ranking: 1,
        type: 'user' as const,
        scope: ['read', 'write']
      });
      sandbox.stub(ScopeManager, 'isScopeAllowed').callsFake((scope: string, allowed: string[] = []) => {
        return allowed.includes(scope);
      });

      const user = { role: 'user', scope: [], username: 'testuser' };
      const client = { role: 'external_client', scope: ['read'] }; // Client only allowed 'read'
      const token = { scope: ['read', 'write'] };

      const result = oauthUtils.recalculateRefreshTokenScopes(token, user, client);
      expect(result).to.deep.equal(['read']);
    });
  });
});
