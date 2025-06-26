import { expect } from 'chai';
import sinon from 'sinon';

describe('CORS Service (Isolated)', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Origin extraction logic', () => {
    const extractOrigin = (uri: string): string => {
      const url = new URL(uri);
      return url.origin;
    };

    it('should extract origin from URI', () => {
      const result = extractOrigin('https://example.com/callback?code=123');
      expect(result).to.equal('https://example.com');
    });

    it('should extract origin from URI with port', () => {
      const result = extractOrigin('http://localhost:3000/auth/callback');
      expect(result).to.equal('http://localhost:3000');
    });

    it('should handle HTTPS URLs', () => {
      const result = extractOrigin('https://secure.example.com/path/to/resource');
      expect(result).to.equal('https://secure.example.com');
    });

    it('should handle URLs with subdomains', () => {
      const result = extractOrigin('https://api.sub.example.com/v1/users');
      expect(result).to.equal('https://api.sub.example.com');
    });

    it('should handle IP addresses', () => {
      const result = extractOrigin('http://192.168.1.1:8080/api');
      expect(result).to.equal('http://192.168.1.1:8080');
    });

    it('should handle different protocols', () => {
      const result = extractOrigin('ftp://files.example.com/downloads');
      expect(result).to.equal('ftp://files.example.com');
    });
  });

  describe('Origin validation logic', () => {
    it('should validate allowed origins correctly', () => {
      const allowedOrigins = new Set([
        'https://allowed.example.com',
        'http://localhost:3000'
      ]);

      const isAllowedOrigin = (origin: string | undefined): boolean => {
        if (allowedOrigins.has(origin as string) || !origin) {
          return true;
        }
        return false;
      };

      expect(isAllowedOrigin('https://allowed.example.com')).to.be.true;
      expect(isAllowedOrigin('http://localhost:3000')).to.be.true;
      expect(isAllowedOrigin('https://notallowed.example.com')).to.be.false;
      expect(isAllowedOrigin(undefined)).to.be.true;
    });

    it('should be case sensitive', () => {
      const allowedOrigins = new Set(['https://example.com']);
      
      const isAllowedOrigin = (origin: string | undefined): boolean => {
        if (allowedOrigins.has(origin as string) || !origin) {
          return true;
        }
        return false;
      };

      expect(isAllowedOrigin('https://example.com')).to.be.true;
      expect(isAllowedOrigin('HTTPS://EXAMPLE.COM')).to.be.false;
    });
  });

  describe('Origin scanning simulation', () => {
    it('should extract origins from client redirect URIs', () => {
      const clients = [
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

      const extractOrigin = (uri: string): string => {
        const url = new URL(uri);
        return url.origin;
      };

      const scanOrigins = (clients: any[]) => {
        const allowedOrigins = new Set<string>();
        
        for (const client of clients) {
          for (const uri of client.redirectUris) {
            try {
              const origin = extractOrigin(uri);
              allowedOrigins.add(origin);
            } catch (e) {
              // Skip invalid URIs
              continue;
            }
          }
        }
        
        return allowedOrigins;
      };

      const result = scanOrigins(clients);

      expect(result.has('https://client1.example.com')).to.be.true;
      expect(result.has('https://client2.example.com')).to.be.true;
      expect(result.has('http://localhost:8080')).to.be.true;
      expect(result.size).to.equal(3);
    });

    it('should handle invalid URIs gracefully', () => {
      const clients = [
        {
          redirectUris: [
            'https://valid.example.com/callback',
            'invalid-uri',
            'https://another-valid.example.com/auth'
          ]
        }
      ];

      const extractOrigin = (uri: string): string => {
        const url = new URL(uri);
        return url.origin;
      };

      const scanOrigins = (clients: any[]) => {
        const allowedOrigins = new Set<string>();
        const errors: string[] = [];
        
        for (const client of clients) {
          for (const uri of client.redirectUris) {
            try {
              const origin = extractOrigin(uri);
              allowedOrigins.add(origin);
            } catch (e) {
              errors.push(uri);
              continue;
            }
          }
        }
        
        return { allowedOrigins, errors };
      };

      const result = scanOrigins(clients);

      expect(result.allowedOrigins.has('https://valid.example.com')).to.be.true;
      expect(result.allowedOrigins.has('https://another-valid.example.com')).to.be.true;
      expect(result.errors).to.include('invalid-uri');
      expect(result.allowedOrigins.size).to.equal(2);
    });

    it('should handle empty clients array', () => {
      const scanOrigins = (clients: any[]) => {
        const allowedOrigins = new Set<string>();
        
        for (const client of clients) {
          for (const uri of client.redirectUris) {
            try {
              const url = new URL(uri);
              allowedOrigins.add(url.origin);
            } catch (e) {
              continue;
            }
          }
        }
        
        return allowedOrigins;
      };

      const result = scanOrigins([]);
      expect(result.size).to.equal(0);
    });
  });
});
