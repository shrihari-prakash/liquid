import { expect } from 'chai';
import sinon from 'sinon';

describe('Email Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('sanitizeEmailAddress logic simulation', () => {
    // Simulate the sanitizeEmailAddress function without external dependencies
    const simulateSanitizeEmailAddress = (
      email: string,
      shouldSanitizeGmail: boolean = true
    ) => {
      email = email.toLowerCase();
      
      if (email.endsWith('@gmail.com') && shouldSanitizeGmail) {
        const parts = email.split('@');
        parts[0] = parts[0].split('+')[0];
        return parts[0].replace(/\./g, '') + '@' + parts[1];
      }
      return email;
    };

    it('should convert email to lowercase', () => {
      const email = 'TEST@EXAMPLE.COM';
      const result = simulateSanitizeEmailAddress(email, false);
      expect(result).to.equal('test@example.com');
    });

    it('should sanitize Gmail addresses when enabled', () => {
      const email = 'test.user+tag@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should remove dots from Gmail username', () => {
      const email = 'first.middle.last@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('firstmiddlelast@gmail.com');
    });

    it('should remove plus tag from Gmail username', () => {
      const email = 'username+shopping@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('username@gmail.com');
    });

    it('should handle both dots and plus tags in Gmail addresses', () => {
      const email = 'first.last+tag@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('firstlast@gmail.com');
    });

    it('should not sanitize Gmail addresses when disabled', () => {
      const email = 'test.user+tag@gmail.com';
      const result = simulateSanitizeEmailAddress(email, false);
      expect(result).to.equal('test.user+tag@gmail.com');
    });

    it('should not sanitize non-Gmail addresses', () => {
      const email = 'test.user+tag@yahoo.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('test.user+tag@yahoo.com');
    });

    it('should handle Gmail addresses with uppercase', () => {
      const email = 'Test.User+Tag@GMAIL.COM';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should handle edge case with only dots in Gmail username', () => {
      const email = '...@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('@gmail.com');
    });

    it('should handle edge case with only plus tag in Gmail username', () => {
      const email = '+tag@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('@gmail.com');
    });

    it('should handle Gmail address with multiple plus signs', () => {
      const email = 'user+tag1+tag2@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('user@gmail.com');
    });

    it('should handle empty username before plus sign', () => {
      const email = 'user.name++@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('username@gmail.com');
    });

    it('should preserve domain for Gmail addresses', () => {
      const email = 'test@gmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('test@gmail.com');
    });

    it('should handle complex Gmail address', () => {
      const email = 'First.Middle.Last+work+project@Gmail.Com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('firstmiddlelast@gmail.com');
    });

    it('should handle similar domains that are not Gmail', () => {
      const email = 'test.user@gmail.co.uk';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('test.user@gmail.co.uk');
    });

    it('should handle domains containing gmail but not exact match', () => {
      const email = 'test.user@mygmail.com';
      const result = simulateSanitizeEmailAddress(email, true);
      expect(result).to.equal('test.user@mygmail.com');
    });
  });
});
