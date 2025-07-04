import { expect } from 'chai';
import sinon from 'sinon';
import { isEmail2FA } from '../../../src/utils/2fa';
import { Configuration } from '../../../src/singleton/configuration';
import { UserInterface } from '../../../src/model/mongo/user';

describe('2FA Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isEmail2FA', () => {
    let configStub: sinon.SinonStub;

    beforeEach(() => {
      configStub = sandbox.stub(Configuration, 'get');
    });

    it('should return true when 2fa email is enforced by configuration', () => {
      configStub.withArgs('2fa.email.enforce').returns(true);
      
      const user = {
        '2faEnabled': false,
        '2faMedium': 'none'
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.true;
    });

    it('should return true when user has email 2fa enabled', () => {
      configStub.withArgs('2fa.email.enforce').returns(false);
      
      const user = {
        '2faEnabled': true,
        '2faMedium': 'email'
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.true;
    });

    it('should return undefined when user has 2fa enabled but not for email', () => {
      configStub.withArgs('2fa.email.enforce').returns(false);
      
      const user = {
        '2faEnabled': true,
        '2faMedium': 'sms'
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.undefined;
    });

    it('should return undefined when user has 2fa disabled', () => {
      configStub.withArgs('2fa.email.enforce').returns(false);
      
      const user = {
        '2faEnabled': false,
        '2faMedium': 'email'
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.undefined;
    });

    it('should return undefined when user has no 2fa settings', () => {
      configStub.withArgs('2fa.email.enforce').returns(false);
      
      const user = {} as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.undefined;
    });

    it('should prioritize enforcement configuration over user settings', () => {
      configStub.withArgs('2fa.email.enforce').returns(true);
      
      const user = {
        '2faEnabled': false,
        '2faMedium': 'sms'
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.true;
    });

    it('should handle missing 2faMedium when 2fa is enabled', () => {
      configStub.withArgs('2fa.email.enforce').returns(false);
      
      const user = {
        '2faEnabled': true
        // missing 2faMedium
      } as unknown as UserInterface;

      const result = isEmail2FA(user);
      expect(result).to.be.undefined;
    });
  });
});
