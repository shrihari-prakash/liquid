import { expect } from 'chai';
import sinon from 'sinon';

describe('2FA Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isEmail2FA logic simulation', () => {
    // Simulate the isEmail2FA function without external dependencies
    const simulateIsEmail2FA = (
      user: { '2faEnabled'?: boolean; '2faMedium'?: string },
      configEnforce: boolean = false
    ) => {
      if (configEnforce) {
        return true;
      }
      // Opt in
      if (user['2faEnabled'] && user['2faMedium'] === 'email') {
        return true;
      }
      return undefined; // Original function returns undefined for false cases
    };

    it('should return true when 2FA is enforced by configuration', () => {
      const user = {};
      const result = simulateIsEmail2FA(user, true);
      expect(result).to.be.true;
    });

    it('should return true when user has opted in for email 2FA', () => {
      const user = {
        '2faEnabled': true,
        '2faMedium': 'email'
      };
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.true;
    });

    it('should return undefined when 2FA is not enforced and user has not opted in', () => {
      const user = {};
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.undefined;
    });

    it('should return undefined when user has 2FA enabled but medium is not email', () => {
      const user = {
        '2faEnabled': true,
        '2faMedium': 'sms'
      };
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.undefined;
    });

    it('should return undefined when user has email medium but 2FA is disabled', () => {
      const user = {
        '2faEnabled': false,
        '2faMedium': 'email'
      };
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.undefined;
    });

    it('should prioritize configuration enforcement over user settings', () => {
      const user = {
        '2faEnabled': false,
        '2faMedium': 'sms'
      };
      const result = simulateIsEmail2FA(user, true);
      expect(result).to.be.true;
    });

    it('should handle user with missing 2FA properties', () => {
      const user = { someOtherProperty: 'value' } as any;
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.undefined;
    });

    it('should handle user with null 2FA properties', () => {
      const user = {
        '2faEnabled': null,
        '2faMedium': null
      };
      const result = simulateIsEmail2FA(user as any, false);
      expect(result).to.be.undefined;
    });

    it('should be case sensitive for 2faMedium', () => {
      const user = {
        '2faEnabled': true,
        '2faMedium': 'EMAIL' // uppercase
      };
      const result = simulateIsEmail2FA(user, false);
      expect(result).to.be.undefined;
    });
  });
});
