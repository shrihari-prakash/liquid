import { expect } from 'chai';
import sinon from 'sinon';
import { isApplicationClient } from '../../../../src/model/oauth/utils';
import { Role } from '../../../../src/singleton/role';

describe('OAuth Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isApplicationClient', () => {
    it('should return true for internal client role', () => {
      const user = { role: Role.SystemRoles.INTERNAL_CLIENT };
      const result = isApplicationClient(user);
      expect(result).to.be.true;
    });

    it('should return true for external client role', () => {
      const user = { role: Role.SystemRoles.EXTERNAL_CLIENT };
      const result = isApplicationClient(user);
      expect(result).to.be.true;
    });

    it('should return false for user role', () => {
      const user = { role: Role.SystemRoles.USER };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for admin role', () => {
      const user = { role: Role.SystemRoles.ADMIN };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for super admin role', () => {
      const user = { role: Role.SystemRoles.SUPER_ADMIN };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for undefined role', () => {
      const user = { role: undefined };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for null role', () => {
      const user = { role: null };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should return false for custom role', () => {
      const user = { role: 'custom_role' };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user without role property', () => {
      const user = {};
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle null user', () => {
      const result = isApplicationClient(null);
      expect(result).to.be.false;
    });

    it('should handle undefined user', () => {
      const result = isApplicationClient(undefined);
      expect(result).to.be.false;
    });

    it('should handle user with empty string role', () => {
      const user = { role: '' };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user with number role', () => {
      const user = { role: 123 };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });

    it('should handle user with boolean role', () => {
      const user = { role: true };
      const result = isApplicationClient(user);
      expect(result).to.be.false;
    });
  });
});
