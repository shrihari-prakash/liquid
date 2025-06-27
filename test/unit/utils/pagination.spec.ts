import { expect } from 'chai';
import sinon from 'sinon';
import { getPaginationLimit } from '../../../src/utils/pagination.js';
import { Configuration } from '../../../src/singleton/configuration.js';

describe('Pagination Utils', () => {
  let sandbox: sinon.SinonSandbox;
  let configStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // Mock Configuration
    configStub = sandbox.stub(Configuration, 'get');
    configStub.withArgs('pagination.default-limit').returns(10);
    configStub.withArgs('pagination.max-limit').returns(100);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getPaginationLimit', () => {
    it('should return parsed number when valid string number is provided', () => {
      const result = getPaginationLimit('50');
      expect(result).to.equal(50);
    });

    it('should return number when number is provided', () => {
      const result = getPaginationLimit(30);
      expect(result).to.equal(30);
    });

    it('should return default limit when invalid string is provided', () => {
      const result = getPaginationLimit('invalid');
      expect(result).to.equal(10);
    });

    it('should return default limit when empty string is provided', () => {
      const result = getPaginationLimit('');
      expect(result).to.equal(10);
    });

    it('should return default limit when zero is provided', () => {
      const result = getPaginationLimit(0);
      expect(result).to.equal(10);
    });

    it('should return default limit when zero string is provided', () => {
      const result = getPaginationLimit('0');
      expect(result).to.equal(10);
    });

    it('should cap limit to max limit when requested limit exceeds maximum', () => {
      const result = getPaginationLimit('150');
      expect(result).to.equal(100);
    });

    it('should cap limit to max limit when requested limit equals maximum', () => {
      const result = getPaginationLimit('100');
      expect(result).to.equal(100);
    });

    it('should return requested limit when it is within bounds', () => {
      const result = getPaginationLimit('50');
      expect(result).to.equal(50);
    });

    it('should handle decimal numbers by truncating', () => {
      const result = getPaginationLimit('25.7');
      expect(result).to.equal(25);
    });

    it('should handle negative numbers by returning them directly', () => {
      const result = getPaginationLimit('-10');
      expect(result).to.equal(-10); // The real implementation doesn't filter negative numbers
    });

    it('should handle floating point numbers', () => {
      const result = getPaginationLimit(45.9);
      expect(result).to.equal(45);
    });

    it('should work with different configuration values', () => {
      configStub.withArgs('pagination.default-limit').returns(25);
      configStub.withArgs('pagination.max-limit').returns(200);

      expect(getPaginationLimit('invalid')).to.equal(25);
      expect(getPaginationLimit('300')).to.equal(200);
      expect(getPaginationLimit('100')).to.equal(100);
      
      // Reset to original values
      configStub.withArgs('pagination.default-limit').returns(10);
      configStub.withArgs('pagination.max-limit').returns(100);
    });

    it('should handle edge case where max limit is less than default limit', () => {
      configStub.withArgs('pagination.default-limit').returns(50);
      configStub.withArgs('pagination.max-limit').returns(30);
      
      const result = getPaginationLimit('invalid');
      expect(result).to.equal(30); // Should be capped to max limit
    });

    it('should handle scientific notation', () => {
      // parseInt('1e2') returns 1, not 100
      const result = getPaginationLimit('1e2');
      expect(result).to.equal(1);
    });

    it('should handle string with whitespace', () => {
      const result = getPaginationLimit('  25  ');
      expect(result).to.equal(25);
    });

    it('should handle string with leading zeros', () => {
      const result = getPaginationLimit('025');
      expect(result).to.equal(25);
    });

    it('should handle hexadecimal string correctly', () => {
      // parseInt('0xFF') returns 255, which exceeds max limit
      const result = getPaginationLimit('0xFF');
      expect(result).to.equal(100); // Should be capped to max limit
    });

    it('should handle very large numbers', () => {
      const result = getPaginationLimit('999999999');
      expect(result).to.equal(100);
    });

    it('should handle boundary values correctly', () => {
      configStub.withArgs('pagination.default-limit').returns(1);
      configStub.withArgs('pagination.max-limit').returns(2);
      
      expect(getPaginationLimit('1')).to.equal(1);
      expect(getPaginationLimit('2')).to.equal(2);
      expect(getPaginationLimit('3')).to.equal(2);
      expect(getPaginationLimit('0')).to.equal(1);
    });

    it('should use Configuration.get to retrieve default and max limits', () => {
      // This test verifies the real implementation uses Configuration
      getPaginationLimit('invalid'); // This should trigger default-limit fallback
      getPaginationLimit('999999'); // This should trigger max-limit capping
      
      expect(configStub.calledWith('pagination.default-limit')).to.be.true;
      expect(configStub.calledWith('pagination.max-limit')).to.be.true;
    });
  });
});
