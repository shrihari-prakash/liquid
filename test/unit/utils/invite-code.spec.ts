import { expect } from 'chai';
import sinon from 'sinon';
import { generateInviteCode } from '../../../src/utils/invite-code.js';

describe('Invite Code Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('generateInviteCode', () => {
    it('should generate invite code with correct format', () => {
      const inviteCode = generateInviteCode();
      
      // Format: XXXX-YYYY-timestamp
      expect(inviteCode).to.match(/^[A-Z]{4}-\d{4}-\d{13}$/);
    });

    it('should include current timestamp', () => {
      const beforeTime = Date.now();
      const inviteCode = generateInviteCode();
      const afterTime = Date.now();
      
      const parts = inviteCode.split('-');
      const timestamp = parseInt(parts[2]);
      
      expect(timestamp).to.be.at.least(beforeTime);
      expect(timestamp).to.be.at.most(afterTime);
    });

    it('should have letters section with 4 uppercase characters', () => {
      const inviteCode = generateInviteCode();
      const parts = inviteCode.split('-');
      const lettersSection = parts[0];
      
      expect(lettersSection).to.have.length(4);
      expect(lettersSection).to.match(/^[A-Z]{4}$/);
    });

    it('should have digits section with 4 numeric characters', () => {
      const inviteCode = generateInviteCode();
      const parts = inviteCode.split('-');
      const digitsSection = parts[1];
      
      expect(digitsSection).to.have.length(4);
      expect(digitsSection).to.match(/^\d{4}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      
      for (let i = 0; i < 10; i++) {
        codes.add(generateInviteCode());
      }
      
      // Should have generated unique codes (very high probability)
      expect(codes.size).to.equal(10);
    });

    it('should maintain consistent structure across generations', () => {
      const codes: string[] = [];
      
      for (let i = 0; i < 5; i++) {
        codes.push(generateInviteCode());
      }
      
      codes.forEach(code => {
        expect(code).to.match(/^[A-Z]{4}-\d{4}-\d{13}$/);
        expect(code.split('-')).to.have.length(3);
      });
    });

    it('should have letters in correct ASCII range (A-Z)', () => {
      const inviteCode = generateInviteCode();
      const parts = inviteCode.split('-');
      const lettersSection = parts[0];
      
      for (let i = 0; i < lettersSection.length; i++) {
        const charCode = lettersSection.charCodeAt(i);
        expect(charCode).to.be.at.least(65); // 'A'
        expect(charCode).to.be.at.most(90);  // 'Z'
      }
    });

    it('should have digits in correct range (0-9)', () => {
      const inviteCode = generateInviteCode();
      const parts = inviteCode.split('-');
      const digitsSection = parts[1];
      
      for (let i = 0; i < digitsSection.length; i++) {
        const digitValue = parseInt(digitsSection[i]);
        expect(digitValue).to.be.at.least(0);
        expect(digitValue).to.be.at.most(9);
      }
    });

    it('should handle different timestamp values', () => {
      // Mock Date.now to test with specific timestamps
      const originalDateNow = Date.now;
      
      const testTimestamp = 1640995200000; // Jan 1, 2022
      sandbox.stub(Date, 'now').returns(testTimestamp);
      
      const inviteCode = generateInviteCode();
      const parts = inviteCode.split('-');
      
      expect(parts[2]).to.equal(testTimestamp.toString());
    });

    it('should create proper separators between sections', () => {
      const inviteCode = generateInviteCode();
      
      expect(inviteCode.charAt(4)).to.equal('-');
      expect(inviteCode.charAt(9)).to.equal('-');
      expect(inviteCode.split('-')).to.have.length(3);
    });

    it('should generate codes with consistent timestamp for rapid calls', () => {
      // Generate multiple codes quickly
      const codes: string[] = [];
      for (let i = 0; i < 3; i++) {
        codes.push(generateInviteCode());
      }
      
      // Extract timestamps
      const timestamps = codes.map(code => code.split('-')[2]);
      
      // Timestamps should be the same or very close (within 10ms)
      const firstTimestamp = parseInt(timestamps[0]);
      timestamps.forEach(ts => {
        const timestamp = parseInt(ts);
        expect(Math.abs(timestamp - firstTimestamp)).to.be.at.most(10);
      });
    });

    it('should test the real implementation uses random generation', () => {
      // Generate multiple codes to ensure they contain different random parts
      const codes: string[] = [];
      for (let i = 0; i < 20; i++) {
        codes.push(generateInviteCode());
      }
      
      // Extract letter and digit parts
      const letterParts = codes.map(code => code.split('-')[0]);
      const digitParts = codes.map(code => code.split('-')[1]);
      
      // Should have some variation in letters and digits (very high probability)
      const uniqueLetterParts = new Set(letterParts);
      const uniqueDigitParts = new Set(digitParts);
      
      expect(uniqueLetterParts.size).to.be.greaterThan(1);
      expect(uniqueDigitParts.size).to.be.greaterThan(1);
    });
  });
});
