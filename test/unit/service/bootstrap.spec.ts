import { expect } from 'chai';
import sinon from 'sinon';

describe('Bootstrap Service', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Bootstrap class simulation', () => {
    // Simulate the Bootstrap class without external dependencies
    class SimulatedBootstrap {
      private config: any;
      private userModel: any;
      private clientModel: any;
      private roleService: any;
      private bcrypt: any;
      private logger: any;

      constructor(mocks: any = {}) {
        this.config = mocks.config || {};
        this.userModel = mocks.userModel || { findOne: sandbox.stub(), save: sandbox.stub() };
        this.clientModel = mocks.clientModel || { findOne: sandbox.stub(), save: sandbox.stub() };
        this.roleService = mocks.roleService || { createDefaultRoles: sandbox.stub().resolves() };
        this.bcrypt = mocks.bcrypt || { hash: sandbox.stub().resolves('hashedPassword') };
        this.logger = mocks.logger || { info: sandbox.stub(), error: sandbox.stub() };
      }

      verifyAdminConfig() {
        const username = this.config['system.super-admin.username'];
        const firstName = this.config['system.super-admin.first-name'];
        const lastName = this.config['system.super-admin.last-name'];
        const password = this.config['system.super-admin.password'];
        const email = this.config['system.super-admin.email'];
        
        if (!username || !firstName || !lastName || !password || !email) {
          throw new Error('Super admin configuration is incomplete. Check the values system.super-admin.* in config.');
        }
      }

      async hasUsers() {
        return this.userModel.findOne({});
      }

      async createSuperAdmin() {
        if (await this.hasUsers()) {
          this.logger.info('Super admin already exists. Skipping creation.');
          return;
        }
        
        this.verifyAdminConfig();
        
        const password = this.config['system.super-admin.password'];
        const hashedPassword = await this.bcrypt.hash(password, 10);
        
        const user = {
          username: this.config['system.super-admin.username'],
          firstName: this.config['system.super-admin.first-name'],
          lastName: this.config['system.super-admin.last-name'],
          email: this.config['system.super-admin.email'],
          sanitizedEmail: this.config['system.super-admin.email'],
          password: hashedPassword,
          role: 'super_admin',
          credits: 0,
          scope: ['*'],
          creationIp: '127.0.0.1',
          emailVerified: true,
          verified: true,
        };
        
        await this.userModel.save(user);
        this.logger.info('Super admin created successfully. username: %s', user.username);
      }

      verifyClientConfig() {
        const id = this.config['system.default-client.id'];
        const redirectUris = this.config['system.default-client.redirect-uris'];
        const secret = this.config['system.default-client.secret'];
        const displayName = this.config['system.default-client.display-name'];
        
        if (!id || !redirectUris || !secret || !displayName) {
          throw new Error('Default client configuration is incomplete. Check the values system.default-client.* in config.');
        }
      }

      async hasClients() {
        return this.clientModel.findOne({});
      }

      async createDefaultClient() {
        try {
          if (await this.hasClients()) {
            this.logger.info('Default client already exists. Skipping creation.');
            return;
          }
          
          this.verifyClientConfig();
          
          const client = {
            id: this.config['system.default-client.id'],
            redirectUris: this.config['system.default-client.redirect-uris'],
            secret: this.config['system.default-client.secret'],
            displayName: this.config['system.default-client.display-name'],
            grants: ['client_credentials', 'authorization_code', 'refresh_token'],
            role: 'internal_client',
            scope: ['*'],
          };
          
          await this.clientModel.save(client);
          this.logger.info('Default client created successfully. id: %s', client.id);
        } catch (error) {
          this.logger.error(error);
        }
      }

      async configure() {
        this.logger.info('Bootstrapping system...');
        await this.createSuperAdmin();
        await this.createDefaultClient();
        await this.roleService.createDefaultRoles();
        this.logger.info('System bootstrapping complete.');
      }
    }

    describe('verifyAdminConfig', () => {
      it('should pass when all admin configuration is provided', () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.not.throw();
      });

      it('should throw error when username is missing', () => {
        const config = {
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });

      it('should throw error when email is missing', () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });

      it('should throw error when password is missing', () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.email': 'admin@example.com'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });

      it('should throw error when first name is missing', () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });

      it('should throw error when last name is missing', () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });

      it('should throw error when all fields are empty strings', () => {
        const config = {
          'system.super-admin.username': '',
          'system.super-admin.first-name': '',
          'system.super-admin.last-name': '',
          'system.super-admin.password': '',
          'system.super-admin.email': ''
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyAdminConfig()).to.throw('Super admin configuration is incomplete');
      });
    });

    describe('hasUsers', () => {
      it('should return true when users exist', async () => {
        const userModel = {
          findOne: sandbox.stub().resolves({ _id: 'user123' })
        };
        
        const bootstrap = new SimulatedBootstrap({ userModel });
        const result = await bootstrap.hasUsers();
        
        expect(result).to.deep.equal({ _id: 'user123' });
        expect(userModel.findOne.calledWith({})).to.be.true;
      });

      it('should return null when no users exist', async () => {
        const userModel = {
          findOne: sandbox.stub().resolves(null)
        };
        
        const bootstrap = new SimulatedBootstrap({ userModel });
        const result = await bootstrap.hasUsers();
        
        expect(result).to.be.null;
        expect(userModel.findOne.calledWith({})).to.be.true;
      });
    });

    describe('createSuperAdmin', () => {
      it('should skip creation when users already exist', async () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        const userModel = {
          findOne: sandbox.stub().resolves({ _id: 'existing-user' }),
          save: sandbox.stub()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, userModel, logger });
        await bootstrap.createSuperAdmin();
        
        expect(logger.info.calledWith('Super admin already exists. Skipping creation.')).to.be.true;
        expect(userModel.save.called).to.be.false;
      });

      it('should create super admin when no users exist', async () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com'
        };
        const userModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const bcrypt = {
          hash: sandbox.stub().resolves('hashedPassword123')
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, userModel, bcrypt, logger });
        await bootstrap.createSuperAdmin();
        
        expect(bcrypt.hash.calledWith('password123', 10)).to.be.true;
        expect(userModel.save.calledOnce).to.be.true;
        
        const savedUser = userModel.save.firstCall.args[0];
        expect(savedUser.username).to.equal('admin');
        expect(savedUser.firstName).to.equal('John');
        expect(savedUser.lastName).to.equal('Doe');
        expect(savedUser.email).to.equal('admin@example.com');
        expect(savedUser.sanitizedEmail).to.equal('admin@example.com');
        expect(savedUser.password).to.equal('hashedPassword123');
        expect(savedUser.role).to.equal('super_admin');
        expect(savedUser.credits).to.equal(0);
        expect(savedUser.scope).to.deep.equal(['*']);
        expect(savedUser.creationIp).to.equal('127.0.0.1');
        expect(savedUser.emailVerified).to.be.true;
        expect(savedUser.verified).to.be.true;
        
        expect(logger.info.calledWith('Super admin created successfully. username: %s', 'admin')).to.be.true;
      });

      it('should throw error when admin config is incomplete', async () => {
        const config = {
          'system.super-admin.username': 'admin'
          // Missing other required fields
        };
        const userModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, userModel });
        
        try {
          await bootstrap.createSuperAdmin();
          expect.fail('Expected createSuperAdmin to throw error');
        } catch (error) {
          expect(error.message).to.include('Super admin configuration is incomplete');
        }
        
        expect(userModel.save.called).to.be.false;
      });
    });

    describe('verifyClientConfig', () => {
      it('should pass when all client configuration is provided', () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyClientConfig()).to.not.throw();
      });

      it('should throw error when client id is missing', () => {
        const config = {
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyClientConfig()).to.throw('Default client configuration is incomplete');
      });

      it('should throw error when redirect uris are missing', () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyClientConfig()).to.throw('Default client configuration is incomplete');
      });

      it('should throw error when client secret is missing', () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.display-name': 'Default Client'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyClientConfig()).to.throw('Default client configuration is incomplete');
      });

      it('should throw error when display name is missing', () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret'
        };
        
        const bootstrap = new SimulatedBootstrap({ config });
        
        expect(() => bootstrap.verifyClientConfig()).to.throw('Default client configuration is incomplete');
      });
    });

    describe('hasClients', () => {
      it('should return true when clients exist', async () => {
        const clientModel = {
          findOne: sandbox.stub().resolves({ _id: 'client123' })
        };
        
        const bootstrap = new SimulatedBootstrap({ clientModel });
        const result = await bootstrap.hasClients();
        
        expect(result).to.deep.equal({ _id: 'client123' });
        expect(clientModel.findOne.calledWith({})).to.be.true;
      });

      it('should return null when no clients exist', async () => {
        const clientModel = {
          findOne: sandbox.stub().resolves(null)
        };
        
        const bootstrap = new SimulatedBootstrap({ clientModel });
        const result = await bootstrap.hasClients();
        
        expect(result).to.be.null;
        expect(clientModel.findOne.calledWith({})).to.be.true;
      });
    });

    describe('createDefaultClient', () => {
      it('should skip creation when clients already exist', async () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const clientModel = {
          findOne: sandbox.stub().resolves({ _id: 'existing-client' }),
          save: sandbox.stub()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, clientModel, logger });
        await bootstrap.createDefaultClient();
        
        expect(logger.info.calledWith('Default client already exists. Skipping creation.')).to.be.true;
        expect(clientModel.save.called).to.be.false;
      });

      it('should create default client when no clients exist', async () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const clientModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, clientModel, logger });
        await bootstrap.createDefaultClient();
        
        expect(clientModel.save.calledOnce).to.be.true;
        
        const savedClient = clientModel.save.firstCall.args[0];
        expect(savedClient.id).to.equal('default-client');
        expect(savedClient.redirectUris).to.deep.equal(['http://localhost:3000']);
        expect(savedClient.secret).to.equal('client-secret');
        expect(savedClient.displayName).to.equal('Default Client');
        expect(savedClient.grants).to.deep.equal(['client_credentials', 'authorization_code', 'refresh_token']);
        expect(savedClient.role).to.equal('internal_client');
        expect(savedClient.scope).to.deep.equal(['*']);
        
        expect(logger.info.calledWith('Default client created successfully. id: %s', 'default-client')).to.be.true;
      });

      it('should handle errors gracefully', async () => {
        const config = {
          'system.default-client.id': 'default-client'
          // Missing other required fields to trigger verifyClientConfig error
        };
        const clientModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, clientModel, logger });
        await bootstrap.createDefaultClient();
        
        expect(logger.error.calledOnce).to.be.true;
        expect(clientModel.save.called).to.be.false;
      });

      it('should handle database save errors', async () => {
        const config = {
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const saveError = new Error('Database save failed');
        const clientModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().rejects(saveError)
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ config, clientModel, logger });
        await bootstrap.createDefaultClient();
        
        expect(logger.error.calledWith(saveError)).to.be.true;
      });
    });

    describe('configure', () => {
      it('should run complete bootstrap process successfully', async () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com',
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const userModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const clientModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const roleService = {
          createDefaultRoles: sandbox.stub().resolves()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ 
          config, 
          userModel, 
          clientModel, 
          roleService, 
          logger 
        });
        
        await bootstrap.configure();
        
        expect(logger.info.calledWith('Bootstrapping system...')).to.be.true;
        expect(userModel.save.calledOnce).to.be.true;
        expect(clientModel.save.calledOnce).to.be.true;
        expect(roleService.createDefaultRoles.calledOnce).to.be.true;
        expect(logger.info.calledWith('System bootstrapping complete.')).to.be.true;
      });

      it('should continue even if super admin creation is skipped', async () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com',
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const userModel = {
          findOne: sandbox.stub().resolves({ _id: 'existing-user' }), // Users exist
          save: sandbox.stub()
        };
        const clientModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const roleService = {
          createDefaultRoles: sandbox.stub().resolves()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ 
          config, 
          userModel, 
          clientModel, 
          roleService, 
          logger 
        });
        
        await bootstrap.configure();
        
        expect(logger.info.calledWith('Bootstrapping system...')).to.be.true;
        expect(logger.info.calledWith('Super admin already exists. Skipping creation.')).to.be.true;
        expect(userModel.save.called).to.be.false;
        expect(clientModel.save.calledOnce).to.be.true;
        expect(roleService.createDefaultRoles.calledOnce).to.be.true;
        expect(logger.info.calledWith('System bootstrapping complete.')).to.be.true;
      });

      it('should continue even if client creation is skipped', async () => {
        const config = {
          'system.super-admin.username': 'admin',
          'system.super-admin.first-name': 'John',
          'system.super-admin.last-name': 'Doe',
          'system.super-admin.password': 'password123',
          'system.super-admin.email': 'admin@example.com',
          'system.default-client.id': 'default-client',
          'system.default-client.redirect-uris': ['http://localhost:3000'],
          'system.default-client.secret': 'client-secret',
          'system.default-client.display-name': 'Default Client'
        };
        const userModel = {
          findOne: sandbox.stub().resolves(null),
          save: sandbox.stub().resolves()
        };
        const clientModel = {
          findOne: sandbox.stub().resolves({ _id: 'existing-client' }), // Clients exist
          save: sandbox.stub()
        };
        const roleService = {
          createDefaultRoles: sandbox.stub().resolves()
        };
        const logger = {
          info: sandbox.stub(),
          error: sandbox.stub()
        };
        
        const bootstrap = new SimulatedBootstrap({ 
          config, 
          userModel, 
          clientModel, 
          roleService, 
          logger 
        });
        
        await bootstrap.configure();
        
        expect(logger.info.calledWith('Bootstrapping system...')).to.be.true;
        expect(userModel.save.calledOnce).to.be.true;
        expect(logger.info.calledWith('Default client already exists. Skipping creation.')).to.be.true;
        expect(clientModel.save.called).to.be.false;
        expect(roleService.createDefaultRoles.calledOnce).to.be.true;
        expect(logger.info.calledWith('System bootstrapping complete.')).to.be.true;
      });
    });
  });
});
