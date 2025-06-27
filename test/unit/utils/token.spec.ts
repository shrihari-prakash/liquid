import { expect } from 'chai';
import sinon from 'sinon';
import { makeToken } from '../../../src/utils/token';

describe('Token Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('makeToken', () => {
    it('should generate token of specified length', () => {
      const length = 10;
      const token = makeToken(length);

      expect(token).to.be.a('string');
      expect(token).to.have.length(length);
    });

    it('should generate token with minimum length', () => {
      const length = 1;
      const token = makeToken(length);

      expect(token).to.be.a('string');
      expect(token).to.have.length(length);
    });

    it('should generate token with larger length', () => {
      const length = 50;
      const token = makeToken(length);

      expect(token).to.be.a('string');
      expect(token).to.have.length(length);
    });

    it('should generate different tokens on multiple calls', () => {
      const length = 20;
      const token1 = makeToken(length);
      const token2 = makeToken(length);

      expect(token1).to.not.equal(token2);
    });

    it('should only contain allowed characters', () => {
      const length = 100;
      const token = makeToken(length);
      const allowedChars = "1234567890abcdefghijklmnopqrstuvwxyz";

      for (const char of token) {
        expect(allowedChars).to.include(char);
      }
    });

    it('should not contain uppercase letters', () => {
      const length = 100;
      const token = makeToken(length);

      expect(token).to.match(/^[^A-Z]*$/);
    });

    it('should not contain special characters', () => {
      const length = 100;
      const token = makeToken(length);

      expect(token).to.match(/^[a-z0-9]*$/);
    });

    it('should handle zero length gracefully', () => {
      const length = 0;
      const token = makeToken(length);

      expect(token).to.be.a('string');
      expect(token).to.have.length(0);
      expect(token).to.equal('');
    });

    it('should handle very large lengths', () => {
      const length = 1000;
      const token = makeToken(length);

      expect(token).to.be.a('string');
      expect(token).to.have.length(length);
    });

    it('should produce tokens with expected character distribution', () => {
      const length = 1000;
      const token = makeToken(length);
      
      // Check that all character types are represented (numbers and letters)
      const hasNumbers = /[0-9]/.test(token);
      const hasLetters = /[a-z]/.test(token);
      
      expect(hasNumbers).to.be.true;
      expect(hasLetters).to.be.true;
    });

    it('should be deterministic in structure', () => {
      // Test that the function maintains consistent behavior
      const lengths = [5, 10, 15, 20];
      
      lengths.forEach(length => {
        const token = makeToken(length);
        expect(token).to.be.a('string');
        expect(token).to.have.length(length);
        expect(token).to.match(/^[a-z0-9]*$/);
      });
    });

    it('should handle edge case lengths', () => {
      const edgeCases = [1, 2, 3];
      
      edgeCases.forEach(length => {
        const token = makeToken(length);
        expect(token).to.be.a('string');
        expect(token).to.have.length(length);
        expect(token).to.match(/^[a-z0-9]*$/);
      });
    });
  });
});
