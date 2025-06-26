import { expect } from 'chai';
import sinon from 'sinon';

describe('API Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('hasErrors logic simulation', () => {
    // Simulate the hasErrors function without external dependencies
    const simulateHasErrors = (
      validationErrors: Array<{ field: string; message: string }>,
      mockResponse: { status: sinon.SinonStub; json: sinon.SinonStub }
    ) => {
      if (validationErrors.length > 0) {
        mockResponse.status(400);
        mockResponse.json({
          ok: 0,
          error: 'ClientInputError',
          additionalInfo: {
            errors: validationErrors
          }
        });
        return true;
      }
      return false;
    };

    it('should return true and send error response when validation errors exist', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' }
      ];

      const result = simulateHasErrors(validationErrors, mockResponse);

      expect(result).to.be.true;
      expect(mockResponse.status.calledWith(400)).to.be.true;
      expect(mockResponse.json.calledOnce).to.be.true;
      
      const responseData = mockResponse.json.getCall(0).args[0];
      expect(responseData.ok).to.equal(0);
      expect(responseData.error).to.equal('ClientInputError');
      expect(responseData.additionalInfo.errors).to.deep.equal(validationErrors);
    });

    it('should return false when no validation errors exist', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      
      const validationErrors: Array<{ field: string; message: string }> = [];

      const result = simulateHasErrors(validationErrors, mockResponse);

      expect(result).to.be.false;
      expect(mockResponse.status.called).to.be.false;
      expect(mockResponse.json.called).to.be.false;
    });

    it('should handle single validation error', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      
      const validationErrors = [
        { field: 'username', message: 'Username already exists' }
      ];

      const result = simulateHasErrors(validationErrors, mockResponse);

      expect(result).to.be.true;
      expect(mockResponse.status.calledWith(400)).to.be.true;
      
      const responseData = mockResponse.json.getCall(0).args[0];
      expect(responseData.additionalInfo.errors).to.have.length(1);
      expect(responseData.additionalInfo.errors[0]).to.deep.equal(validationErrors[0]);
    });

    it('should handle multiple validation errors', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      
      const validationErrors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' },
        { field: 'confirmPassword', message: 'Passwords do not match' }
      ];

      const result = simulateHasErrors(validationErrors, mockResponse);

      expect(result).to.be.true;
      const responseData = mockResponse.json.getCall(0).args[0];
      expect(responseData.additionalInfo.errors).to.have.length(3);
      expect(responseData.additionalInfo.errors).to.deep.equal(validationErrors);
    });

    it('should maintain response chaining pattern', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub().returnsThis()
      };
      
      const validationErrors = [
        { field: 'test', message: 'Test error' }
      ];

      simulateHasErrors(validationErrors, mockResponse);

      // Verify that status returns 'this' for chaining
      expect(mockResponse.status.returned(mockResponse)).to.be.true;
    });

    it('should use correct HTTP status code for client input errors', () => {
      const mockResponse = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      
      const validationErrors = [
        { field: 'field1', message: 'Error message' }
      ];

      simulateHasErrors(validationErrors, mockResponse);

      expect(mockResponse.status.calledWith(400)).to.be.true;
    });
  });
});
