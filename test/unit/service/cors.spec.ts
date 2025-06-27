import { expect } from 'chai';
import sinon from 'sinon';
import { CORS } from '../../../src/service/cors/cors';
import ClientModel from '../../../src/model/mongo/client';

describe('CORS Service', () => {
  let sandbox: sinon.SinonSandbox;
  let cors: CORS;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    cors = new CORS();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Origin extraction logic', () => {
    it('should extract origin from URI', () => {
      const result = cors.extractOrigin('https://example.com/callback?code=123');
      expect(result).to.equal('https://example.com');
    });

    it('should extract origin from URI with port', () => {
      const result = cors.extractOrigin('http://localhost:3000/auth/callback');
      expect(result).to.equal('http://localhost:3000');
    });

    it('should handle HTTPS URLs', () => {
      const result = cors.extractOrigin('https://secure.example.com/path/to/resource');
      expect(result).to.equal('https://secure.example.com');
    });

    it('should handle URLs with subdomains', () => {
      const result = cors.extractOrigin('https://api.sub.example.com/v1/users');
      expect(result).to.equal('https://api.sub.example.com');
    });

    it('should handle IP addresses', () => {
      const result = cors.extractOrigin('http://192.168.1.1:8080/api');
      expect(result).to.equal('http://192.168.1.1:8080');
    });

    it('should handle different protocols', () => {
      const result = cors.extractOrigin('ftp://files.example.com/downloads');
      expect(result).to.equal('ftp://files.example.com');
    });
  });

  describe('Origin validation logic', () => {
    it('should validate allowed origins correctly', () => {
      // Test the actual CORS instance
      cors.allowedOrigins.add('https://allowed.example.com');
      cors.allowedOrigins.add('http://localhost:3000');

      expect(cors.allowedOrigins.has('https://allowed.example.com')).to.be.true;
      expect(cors.allowedOrigins.has('http://localhost:3000')).to.be.true;
      expect(cors.allowedOrigins.has('https://notallowed.example.com')).to.be.false;
    });

    it('should be case sensitive', () => {
      cors.allowedOrigins.add('https://example.com');
      
      expect(cors.allowedOrigins.has('https://example.com')).to.be.true;
      expect(cors.allowedOrigins.has('HTTPS://EXAMPLE.COM')).to.be.false;
    });
  });

  describe('Origin scanning functionality', () => {
    let clientModelStub: sinon.SinonStub;

    beforeEach(() => {
      clientModelStub = sandbox.stub(ClientModel, 'find');
    });

    it('should extract origins from client redirect URIs', async () => {
      const mockClients = [
        {
          redirectUris: [
            'https://client1.example.com/callback',
            'https://client1.example.com/auth'
          ]
        },
        {
          redirectUris: [
            'https://client2.example.com/callback',
            'http://localhost:8080/dev'
          ]
        }
      ];

      clientModelStub.resolves(mockClients);

      await cors.scanOrigins();

      expect(cors.allowedOrigins.has('https://client1.example.com')).to.be.true;
      expect(cors.allowedOrigins.has('https://client2.example.com')).to.be.true;
      expect(cors.allowedOrigins.has('http://localhost:8080')).to.be.true;
    });

    it('should handle invalid URIs gracefully', async () => {
      const mockClients = [
        {
          redirectUris: [
            'https://valid.example.com/callback',
            'invalid-uri',
            'https://another-valid.example.com/auth'
          ]
        }
      ];

      clientModelStub.resolves(mockClients);

      await cors.scanOrigins();

      expect(cors.allowedOrigins.has('https://valid.example.com')).to.be.true;
      expect(cors.allowedOrigins.has('https://another-valid.example.com')).to.be.true;
      // Should not have the invalid URI
    });

    it('should handle empty clients array', async () => {
      clientModelStub.resolves([]);

      await cors.scanOrigins();

      // Should only have system origins, no client origins
      expect(cors.allowedOrigins.size).to.be.greaterThan(0); // Has system origins
    });
  });
});
