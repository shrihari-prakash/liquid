import { expect } from 'chai';
import { SuccessResponse, ErrorResponse } from '../../../src/utils/response.js';

describe('Response Utils', () => {
  describe('SuccessResponse', () => {
    it('should create success response without data', () => {
      const response = new SuccessResponse();

      expect(response.ok).to.equal(1);
      expect(response.data).to.be.undefined;
    });

    it('should create success response with data', () => {
      const data = { id: 1, name: 'test' };
      const response = new SuccessResponse(data);

      expect(response.ok).to.equal(1);
      expect(response.data).to.deep.equal(data);
    });

    it('should create success response with null data', () => {
      const response = new SuccessResponse(null);

      expect(response.ok).to.equal(1);
      expect(response.data).to.be.null;
    });

    it('should create success response with array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = new SuccessResponse(data);

      expect(response.ok).to.equal(1);
      expect(response.data).to.deep.equal(data);
    });

    it('should create success response with string data', () => {
      const data = 'success message';
      const response = new SuccessResponse(data);

      expect(response.ok).to.equal(1);
      expect(response.data).to.equal(data);
    });

    it('should create success response with number data', () => {
      const data = 42;
      const response = new SuccessResponse(data);

      expect(response.ok).to.equal(1);
      expect(response.data).to.equal(data);
    });

    it('should create success response with boolean data', () => {
      const data = true;
      const response = new SuccessResponse(data);

      expect(response.ok).to.equal(1);
      expect(response.data).to.equal(data);
    });
  });

  describe('ErrorResponse', () => {
    it('should create error response with error message only', () => {
      const error = 'Something went wrong';
      const response = new ErrorResponse(error);

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal(error);
      expect(response.additionalInfo).to.be.undefined;
    });

    it('should create error response with error message and additional data', () => {
      const error = 'Validation failed';
      const additionalInfo = { field: 'email', code: 'INVALID_FORMAT' };
      const response = new ErrorResponse(error, additionalInfo);

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal(error);
      expect(response.additionalInfo).to.deep.equal(additionalInfo);
    });

    it('should create error response with empty error message', () => {
      const response = new ErrorResponse('');

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal('');
      expect(response.additionalInfo).to.be.undefined;
    });

    it('should create error response with null additional info', () => {
      const error = 'Error occurred';
      const response = new ErrorResponse(error, null);

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal(error);
      expect(response.additionalInfo).to.be.null;
    });

    it('should create error response with array additional info', () => {
      const error = 'Multiple errors';
      const additionalInfo = ['Error 1', 'Error 2', 'Error 3'];
      const response = new ErrorResponse(error, additionalInfo);

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal(error);
      expect(response.additionalInfo).to.deep.equal(additionalInfo);
    });

    it('should create error response with string additional info', () => {
      const error = 'Database error';
      const additionalInfo = 'Connection timeout';
      const response = new ErrorResponse(error, additionalInfo);

      expect(response.ok).to.equal(0);
      expect(response.error).to.equal(error);
      expect(response.additionalInfo).to.equal(additionalInfo);
    });
  });

  describe('Response structure consistency', () => {
    it('should have consistent ok field values', () => {
      const success = new SuccessResponse();
      const error = new ErrorResponse('error');

      expect(success.ok).to.equal(1);
      expect(error.ok).to.equal(0);
      expect(success.ok).not.to.equal(error.ok);
    });

    it('should differentiate between success and error responses', () => {
      const success = new SuccessResponse({ message: 'OK' });
      const error = new ErrorResponse('Failed');

      expect(success.ok).to.be.greaterThan(error.ok);
      expect(success).to.have.property('data');
      expect(success).not.to.have.property('error');
      expect(error).to.have.property('error');
      expect(error).not.to.have.property('data');
    });
  });
});
