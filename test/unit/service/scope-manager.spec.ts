import { expect } from 'chai';
import sinon from 'sinon';
import { ScopeManager } from '../../../src/service/scope-manager/scope-manager.js';
import { Role } from '../../../src/singleton/role.js';

describe('ScopeManager Service', () => {
  let sandbox: sinon.SinonSandbox;
  let scopeManager: ScopeManager;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    scopeManager = new ScopeManager();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('canRequestScope', () => {
    it('should return false if requested scopes are null/undefined', () => {
      expect(scopeManager.canRequestScope(null as any, {})).to.be.false;
    });

    it('should flatten and evaluate role scopes correctly', () => {
      sandbox.stub(Role, 'getRoleScopes').returns(['client:all'] as any);
      
      const entity = { role: 'internal_client', scope: ['client:all'] };
      
      const result = scopeManager.canRequestScope(['client:oauth:introspect'], entity);
      
      expect(result).to.be.true;
    });

    it('should allow scope if explicitly granted in entity.scope', () => {
      const entity = { scope: ['client:all'] };
      
      const result = scopeManager.canRequestScope(['client:oauth:introspect'], entity);
      
      expect(result).to.be.true;
    });

    it('should deny scope if not present in role or entity scope', () => {
      sandbox.stub(Role, 'getRoleScopes').returns(['delegated:all'] as any);
      
      const entity = { role: 'user', scope: ['delegated:all'] };
      
      const result = scopeManager.canRequestScope(['client:oauth:introspect'], entity);
      
      expect(result).to.be.false;
    });
  });

  describe('isScopeAllowedForSession', () => {
    it('should correctly evaluate flattened scopes from session', () => {
      sandbox.stub(Role, 'getRoleScopes').returns(['client:all'] as any);
      
      const mockRes = {
        locals: {
          oauth: {
            token: {
              scope: ['client:all'],
              client: {
                role: 'internal_client',
                scope: ['client:all']
              }
            }
          }
        },
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      } as any;

      const result = scopeManager.isScopeAllowedForSession('client:oauth:introspect', mockRes);
      
      expect(result).to.be.true;
      expect(mockRes.status.called).to.be.false;
    });

    it('should deny and return 401 if scope is not allowed', () => {
      sandbox.stub(Role, 'getRoleScopes').returns(['delegated:all'] as any);
      
      const mockRes = {
        locals: {
          oauth: {
            token: {
              scope: ['delegated:all'],
              client: {
                role: 'user',
                scope: ['delegated:all']
              }
            }
          }
        },
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      } as any;

      const result = scopeManager.isScopeAllowedForSession('client:oauth:introspect', mockRes);
      
      expect(result).to.be.false;
      expect(mockRes.status.calledWith(401)).to.be.true;
      expect(mockRes.json.called).to.be.true;
    });
  });

  describe('isScopeAllowedForSharedSession', () => {
    it('should allow shared session scopes if client has access', () => {
      sandbox.stub(Role, 'getRoleScopes').returns(['client:all'] as any);
      
      const mockRes = {
        locals: {
          oauth: {
            token: {
              scope: ['client:all'],
              client: {
                role: 'internal_client',
                scope: ['client:all']
              },
              user: {
                role: 'internal_client'
              }
            }
          }
        },
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      } as any;

      const result = scopeManager.isScopeAllowedForSharedSession('<ENTITY>:oauth:introspect', mockRes);
      
      expect(result).to.be.true;
      expect(mockRes.status.called).to.be.false;
    });
  });
});
