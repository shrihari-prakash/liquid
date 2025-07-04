import { expect } from 'chai';
import sinon from 'sinon';
import { hasErrors } from '../../../src/utils/api';

describe('API Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('hasErrors', () => {
    it('should be a function', () => {
      expect(hasErrors).to.be.a('function');
    });

    it('should expect two parameters (req and res)', () => {
      expect(hasErrors.length).to.equal(2);
    });

    // Note: Full testing of this function requires mocking express-validator's validationResult
    // which is complex in an ES module environment. The function is tested through integration tests.
    // This is a basic structural test to ensure the function exists and has the correct signature.
  });
});
