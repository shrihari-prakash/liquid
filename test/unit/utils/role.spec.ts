import { expect } from 'chai';
import sinon from 'sinon';
import { isRoleRankHigher, isRoleInvalidated } from '../../../src/utils/role.js';
import { Configuration } from '../../../src/singleton/configuration.js';
import { Redis } from '../../../src/singleton/redis.js';
import { Role } from '../../../src/singleton/role.js';

describe('Role Utils', () => {
  let sandbox: sinon.SinonSandbox;
  let configStub: sinon.SinonStub;
  let redisStub: sinon.SinonStub;
  let roleStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock Configuration
    configStub = sandbox.stub(Configuration, 'get');
    
    // Mock Redis
    redisStub = sandbox.stub(Redis, 'get');
    
    // Mock Role.getRoleRank
    roleStub = sandbox.stub(Role, 'getRoleRank');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isRoleRankHigher', () => {
    it('should return true when current role rank is higher (lower number) than comparison role', () => {
      roleStub.withArgs('admin').returns(2);
      roleStub.withArgs('user').returns(4);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result = isRoleRankHigher('admin', 'user');

      expect(result).to.be.true;
      expect(roleStub.calledWith('admin')).to.be.true;
      expect(roleStub.calledWith('user')).to.be.true;
      expect(configStub.calledWith('admin-api.user.profile.can-edit-peer-data')).to.be.true;
    });

    it('should return false when current role rank is lower (higher number) than comparison role', () => {
      roleStub.withArgs('user').returns(4);
      roleStub.withArgs('admin').returns(2);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result = isRoleRankHigher('user', 'admin');

      expect(result).to.be.false;
    });

    it('should return false when current role rank equals comparison role and cannot edit peer data', () => {
      roleStub.withArgs('admin').returns(2);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result = isRoleRankHigher('admin', 'admin');

      expect(result).to.be.false;
    });

    it('should return true when current role rank equals comparison role and can edit peer data', () => {
      roleStub.withArgs('admin').returns(2);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(true);

      const result = isRoleRankHigher('admin', 'admin');

      expect(result).to.be.true;
    });

    it('should handle super_admin role correctly', () => {
      roleStub.withArgs('super_admin').returns(1);
      roleStub.withArgs('admin').returns(2);
      roleStub.withArgs('user').returns(4);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result1 = isRoleRankHigher('super_admin', 'admin');
      const result2 = isRoleRankHigher('super_admin', 'user');
      const result3 = isRoleRankHigher('admin', 'super_admin');

      expect(result1).to.be.true;
      expect(result2).to.be.true;
      expect(result3).to.be.false;
    });

    it('should handle client roles correctly', () => {
      roleStub.withArgs('internal_client').returns(6);
      roleStub.withArgs('external_client').returns(7);
      roleStub.withArgs('user').returns(4);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result1 = isRoleRankHigher('internal_client', 'external_client');
      const result2 = isRoleRankHigher('external_client', 'internal_client');
      const result3 = isRoleRankHigher('user', 'internal_client');

      expect(result1).to.be.true;
      expect(result2).to.be.false;
      expect(result3).to.be.true;
    });

    it('should handle unknown roles with undefined rank', () => {
      roleStub.withArgs('unknown_role').returns(undefined);
      roleStub.withArgs('user').returns(4);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);

      const result1 = isRoleRankHigher('unknown_role', 'user');
      const result2 = isRoleRankHigher('user', 'unknown_role');

      expect(result1).to.be.false; // undefined is falsy, so comparison fails
      expect(result2).to.be.false; // undefined is falsy, so comparison fails
    });

    it('should respect peer data editing configuration', () => {
      roleStub.withArgs('moderator').returns(3);
      roleStub.withArgs('user').returns(4);

      // Test with canEditPeerData = false
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);
      const result1 = isRoleRankHigher('moderator', 'user');
      const result2 = isRoleRankHigher('moderator', 'moderator');

      // Test with canEditPeerData = true
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(true);
      const result3 = isRoleRankHigher('moderator', 'user');
      const result4 = isRoleRankHigher('moderator', 'moderator');

      expect(result1).to.be.true; // 3 < 4
      expect(result2).to.be.false; // 3 is not < 3
      expect(result3).to.be.true; // 3 <= 4
      expect(result4).to.be.true; // 3 <= 3
    });
  });

  describe('isRoleInvalidated', () => {
    it('should return false when no invalidation time is found', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves(null);

      const result = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(result).to.be.false;
      expect(redisStub.calledWith('role_invalidation:admin')).to.be.true;
    });

    it('should return false when invalidation time is before entity registration', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2022-12-31T23:59:59Z');

      const result = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(result).to.be.false;
    });

    it('should return true when invalidation time is after entity registration', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:01Z');

      const result = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(result).to.be.true;
    });

    it('should return false when invalidation time equals entity registration time', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:00Z');

      const result = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(result).to.be.false;
    });

    it('should handle Date objects for entity registration time', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:01Z');
      const registrationDate = new Date('2023-01-01T00:00:00Z');
      
      const result = await isRoleInvalidated('admin', registrationDate);

      expect(result).to.be.true;
    });

    it('should handle different role types', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:01Z');
      redisStub.withArgs('role_invalidation:user').resolves(null);
      redisStub.withArgs('role_invalidation:moderator').resolves('2022-12-31T23:59:59Z');

      const result1 = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');
      const result2 = await isRoleInvalidated('user', '2023-01-01T00:00:00Z');
      const result3 = await isRoleInvalidated('moderator', '2023-01-01T00:00:00Z');

      expect(result1).to.be.true; // invalidated after registration
      expect(result2).to.be.false; // no invalidation time
      expect(result3).to.be.false; // invalidated before registration
    });

    it('should use correct Redis key format with RedisPrefixes', async () => {
      redisStub.withArgs('role_invalidation:test_role').resolves(null);

      await isRoleInvalidated('test_role', '2023-01-01T00:00:00Z');

      expect(redisStub.calledWith('role_invalidation:test_role')).to.be.true;
    });

    it('should handle millisecond precision differences', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:00.001Z');

      const result = await isRoleInvalidated('admin', '2023-01-01T00:00:00.000Z');

      expect(result).to.be.true;
    });

    it('should handle timezone differences correctly', async () => {
      // UTC time
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:00Z');
      
      // Registration time in different timezone (earlier in UTC)
      const result = await isRoleInvalidated('admin', '2022-12-31T23:59:59Z');

      expect(result).to.be.true;
    });

    it('should handle special characters in role names', async () => {
      redisStub.withArgs('role_invalidation:role_with_underscores').resolves(null);
      redisStub.withArgs('role_invalidation:role-with-dashes').resolves(null);

      await isRoleInvalidated('role_with_underscores', '2023-01-01T00:00:00Z');
      await isRoleInvalidated('role-with-dashes', '2023-01-01T00:00:00Z');

      expect(redisStub.calledWith('role_invalidation:role_with_underscores')).to.be.true;
      expect(redisStub.calledWith('role_invalidation:role-with-dashes')).to.be.true;
    });

    it('should be consistent with multiple calls', async () => {
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:01Z');
      
      const result1 = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');
      const result2 = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');
      const result3 = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(result1).to.equal(result2);
      expect(result2).to.equal(result3);
      expect(result1).to.be.true;
    });
  });

  describe('Integration scenarios', () => {
    it('should handle role hierarchy with invalidation checks', async () => {
      roleStub.withArgs('admin').returns(2);
      roleStub.withArgs('user').returns(4);
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);
      redisStub.withArgs('role_invalidation:admin').resolves('2023-01-01T00:00:01Z');

      // Check role rank comparison
      const isHigherRank = isRoleRankHigher('admin', 'user');
      
      // Check if admin role is invalidated
      const isInvalidated = await isRoleInvalidated('admin', '2023-01-01T00:00:00Z');

      expect(isHigherRank).to.be.true;
      expect(isInvalidated).to.be.true;
    });

    it('should handle peer editing permissions correctly', () => {
      roleStub.withArgs('admin').returns(2);
      
      // Admin trying to edit another admin with peer editing enabled
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(true);
      const canEditPeer = isRoleRankHigher('admin', 'admin');
      
      // Admin trying to edit another admin with peer editing disabled
      configStub.withArgs('admin-api.user.profile.can-edit-peer-data').returns(false);
      const cannotEditPeer = isRoleRankHigher('admin', 'admin');

      expect(canEditPeer).to.be.true;
      expect(cannotEditPeer).to.be.false;
    });
  });
});
