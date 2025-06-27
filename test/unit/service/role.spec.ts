import { expect } from 'chai';
import sinon from 'sinon';
import { Role } from '../../../src/service/role/role';
import RoleModel from '../../../src/model/mongo/role';

describe('Role Service', () => {
  let sandbox: sinon.SinonSandbox;
  let roleService: Role;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    roleService = new Role();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Role mapping logic', () => {
    it('should create roles map from array of roles', () => {
      const roles = [
        { id: 'admin', name: 'Administrator', scopes: ['read', 'write'] },
        { id: 'user', name: 'User', scopes: ['read'] }
      ] as any[];

      const rolesMap = roleService.getRolesMap(roles);

      expect(rolesMap.size).to.equal(2);
      expect(rolesMap.has('admin')).to.be.true;
      expect(rolesMap.has('user')).to.be.true;
      expect(rolesMap.get('admin')).to.deep.equal(roles[0]);
      expect(rolesMap.get('user')).to.deep.equal(roles[1]);
    });

    it('should handle empty roles array', () => {
      const roles: any[] = [];
      
      const rolesMap = roleService.getRolesMap(roles);

      expect(rolesMap.size).to.equal(0);
    });

    it('should handle single role', () => {
      const roles = [
        { id: 'guest', name: 'Guest', scopes: [] }
      ] as any[];

      const rolesMap = roleService.getRolesMap(roles);

      expect(rolesMap.size).to.equal(1);
      expect(rolesMap.has('guest')).to.be.true;
      expect(rolesMap.get('guest')).to.deep.equal(roles[0]);
    });

    it('should overwrite duplicate role IDs', () => {
      const roles = [
        { id: 'admin', name: 'Administrator', scopes: ['read'] },
        { id: 'admin', name: 'Super Admin', scopes: ['read', 'write'] }
      ] as any[];

      const rolesMap = roleService.getRolesMap(roles);

      expect(rolesMap.size).to.equal(1);
      expect(rolesMap.get('admin')).to.deep.equal(roles[1]); // Should be the last one
    });
  });

  describe('System roles constants', () => {
    it('should have correct system role constants', () => {
      expect(roleService.SystemRoles.SUPER_ADMIN).to.equal('super_admin');
      expect(roleService.SystemRoles.ADMIN).to.equal('admin');
      expect(roleService.SystemRoles.USER).to.equal('user');
      expect(roleService.SystemRoles.INTERNAL_CLIENT).to.equal('internal_client');
      expect(roleService.SystemRoles.EXTERNAL_CLIENT).to.equal('external_client');
    });

    it('should have unique role values', () => {
      const values = Object.values(roleService.SystemRoles);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).to.equal(values.length);
    });

    it('should contain all expected role types', () => {
      const expectedRoles = ['super_admin', 'admin', 'user', 'internal_client', 'external_client'];
      const actualRoles = Object.values(roleService.SystemRoles);
      
      expectedRoles.forEach(role => {
        expect(actualRoles).to.include(role);
      });
    });
  });

  describe('Role validation logic', () => {
    let roleModelStub: sinon.SinonStub;

    beforeEach(() => {
      roleModelStub = sandbox.stub(RoleModel, 'find');
    });

    it('should validate existing roles', () => {
      const availableRoles = ['admin', 'user', 'guest'];
      
      // Test role existence in map
      const mockRoles = [
        { id: 'admin', name: 'Administrator' },
        { id: 'user', name: 'User' },
        { id: 'guest', name: 'Guest' }
      ] as any[];
      
      const rolesMap = roleService.getRolesMap(mockRoles);
      
      expect(rolesMap.has('admin')).to.be.true;
      expect(rolesMap.has('user')).to.be.true;
      expect(rolesMap.has('guest')).to.be.true;
    });

    it('should reject invalid roles', () => {
      const mockRoles = [
        { id: 'admin', name: 'Administrator' },
        { id: 'user', name: 'User' }
      ] as any[];
      
      const rolesMap = roleService.getRolesMap(mockRoles);
      
      expect(rolesMap.has('guest')).to.be.false;
      expect(rolesMap.has('invalid')).to.be.false;
      expect(rolesMap.has('')).to.be.false;
    });

    it('should handle empty available roles', () => {
      const rolesMap = roleService.getRolesMap([]);
      
      expect(rolesMap.has('admin')).to.be.false;
      expect(rolesMap.size).to.equal(0);
    });

    it('should be case sensitive', () => {
      const mockRoles = [
        { id: 'admin', name: 'Administrator' },
        { id: 'user', name: 'User' }
      ] as any[];
      
      const rolesMap = roleService.getRolesMap(mockRoles);
      
      expect(rolesMap.has('Admin')).to.be.false;
      expect(rolesMap.has('USER')).to.be.false;
    });
  });
});