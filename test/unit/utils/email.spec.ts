import { expect } from 'chai';
import sinon from 'sinon';
import { sanitizeEmailAddress } from '../../../src/utils/email';
import { Configuration } from '../../../src/singleton/configuration';

describe('Email Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('sanitizeEmailAddress', () => {
    let configStub: sinon.SinonStub;

    beforeEach(() => {
      configStub = sandbox.stub(Configuration, 'get');
    });

    it('should convert email to lowercase', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(false);
      
      const result = sanitizeEmailAddress('Test@Example.COM');
      expect(result).to.equal('test@example.com');
    });

    it('should sanitize Gmail addresses when configuration is enabled', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('test.user+tag@gmail.com');
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should not sanitize Gmail addresses when configuration is disabled', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(false);
      
      const result = sanitizeEmailAddress('test.user+tag@gmail.com');
      expect(result).to.equal('test.user+tag@gmail.com');
    });

    it('should remove dots from Gmail usernames when sanitizing', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('t.e.s.t@gmail.com');
      expect(result).to.equal('test@gmail.com');
    });

    it('should remove plus tags from Gmail addresses when sanitizing', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('testuser+newsletter@gmail.com');
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should handle complex Gmail addresses with both dots and plus tags', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('t.e.s.t.u.s.e.r+tag123@gmail.com');
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should not sanitize non-Gmail addresses', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('test.user+tag@example.com');
      expect(result).to.equal('test.user+tag@example.com');
    });

    it('should handle empty email address', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('');
      expect(result).to.equal('');
    });

    it('should handle mixed case Gmail addresses', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('Test.User+TAG@Gmail.COM');
      expect(result).to.equal('testuser@gmail.com');
    });

    it('should handle edge cases with multiple dots and plus signs', () => {
      configStub.withArgs('user.account-creation.sanitize-gmail-addresses').returns(true);
      
      const result = sanitizeEmailAddress('a.b.c.d.e+tag1+tag2@gmail.com');
      expect(result).to.equal('abcde@gmail.com');
    });
  });
});
