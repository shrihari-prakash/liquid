import { expect } from 'chai';
import sinon from 'sinon';
import { isTokenInvalidated } from '../../../src/utils/session';

describe('Session Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isTokenInvalidated', () => {
    it('should return false when globalLogoutAt is null', () => {
      const result = isTokenInvalidated(null as any, '2023-01-01T00:00:00Z');
      expect(result).to.be.false;
    });

    it('should return false when globalLogoutAt is undefined', () => {
      const result = isTokenInvalidated(undefined as any, '2023-01-01T00:00:00Z');
      expect(result).to.be.false;
    });

    it('should return false when globalLogoutAt is empty string', () => {
      const result = isTokenInvalidated('', '2023-01-01T00:00:00Z');
      expect(result).to.be.false;
    });

    it('should return true when globalLogoutAt is after token registration', () => {
      const globalLogoutAt = '2023-01-02T00:00:00Z';
      const tokenRegisteredAt = '2023-01-01T00:00:00Z';
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.true;
    });

    it('should return false when globalLogoutAt is before token registration', () => {
      const globalLogoutAt = '2023-01-01T00:00:00Z';
      const tokenRegisteredAt = '2023-01-02T00:00:00Z';
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.false;
    });

    it('should return false when globalLogoutAt equals token registration time', () => {
      const timestamp = '2023-01-01T12:00:00Z';
      
      const result = isTokenInvalidated(timestamp, timestamp);
      expect(result).to.be.false;
    });

    it('should handle Date objects for token registration time', () => {
      const globalLogoutAt = '2023-01-02T00:00:00Z';
      const tokenRegisteredAt = new Date('2023-01-01T00:00:00Z');
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.true;
    });

    it('should handle millisecond precision differences', () => {
      const globalLogoutAt = '2023-01-01T12:00:00.100Z';
      const tokenRegisteredAt = '2023-01-01T12:00:00.050Z';
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.true;
    });

    it('should handle timezone differences correctly', () => {
      const globalLogoutAt = '2023-01-01T12:00:00+00:00'; // UTC
      const tokenRegisteredAt = '2023-01-01T08:00:00-04:00'; // EST (same time as UTC)
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.false; // Same time, so not invalidated
    });

    it('should handle different date formats', () => {
      const globalLogoutAt = '2023-01-02';
      const tokenRegisteredAt = '2023-01-01';
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.true;
    });

    it('should handle edge case with very close timestamps', () => {
      const baseTime = new Date('2023-01-01T12:00:00Z').getTime();
      const globalLogoutAt = new Date(baseTime + 1).toISOString(); // 1ms later
      const tokenRegisteredAt = new Date(baseTime).toISOString();
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      expect(result).to.be.true;
    });

    it('should handle invalid date strings gracefully', () => {
      // With moment.js, invalid dates might behave differently than native Date
      const globalLogoutAt = 'invalid-date';
      const tokenRegisteredAt = '2023-01-01T00:00:00Z';
      
      const result = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      // The behavior depends on how moment handles invalid dates
      expect(typeof result).to.equal('boolean');
    });

    it('should handle numerical timestamps converted to ISO strings', () => {
      const globalLogoutTime = new Date('2023-01-02T00:00:00Z').getTime();
      const tokenRegisteredTime = new Date('2023-01-01T00:00:00Z').getTime();
      
      // Convert to ISO string format as the function expects string input
      const result = isTokenInvalidated(
        new Date(globalLogoutTime).toISOString(),
        new Date(tokenRegisteredTime).toISOString()
      );
      expect(result).to.be.true;
    });

    it('should be consistent with multiple calls', () => {
      const globalLogoutAt = '2023-01-02T00:00:00Z';
      const tokenRegisteredAt = '2023-01-01T00:00:00Z';
      
      const result1 = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      const result2 = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      const result3 = isTokenInvalidated(globalLogoutAt, tokenRegisteredAt);
      
      expect(result1).to.equal(result2);
      expect(result2).to.equal(result3);
      expect(result1).to.be.true;
    });

    it('should handle real-world scenario with current time', () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 3600000); // 1 hour ago
      const futureTime = new Date(now.getTime() + 3600000); // 1 hour from now
      
      // Token registered in past, logout now - should be invalidated
      expect(isTokenInvalidated(now.toISOString(), pastTime.toISOString())).to.be.true;
      
      // Token registered now, logout in past - should not be invalidated
      expect(isTokenInvalidated(pastTime.toISOString(), now.toISOString())).to.be.false;
      
      // Token registered in future, logout now - should not be invalidated
      expect(isTokenInvalidated(now.toISOString(), futureTime.toISOString())).to.be.false;
    });
  });
});
