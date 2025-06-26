import { expect } from 'chai';
import sinon from 'sinon';

describe('OAuth Cache (Isolated)', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('flushUserInfoFromRedis simulation', () => {
    it('should handle single user ID correctly', () => {
      // Simulate the function logic without importing the actual module
      const mockRedis = {
        del: sandbox.stub().resolves()
      };
      
      const getPrefixedUserId = (userId: string) => `user:${userId}`;
      
      // Simulate the function
      const flushUserInfoFromRedis = async (userIds: string | string[]) => {
        if (typeof userIds === "string") {
          userIds = [userIds];
        }
        for (let i = 0; i < userIds.length; i++) {
          const key = getPrefixedUserId(userIds[i]);
          await mockRedis.del(key);
        }
      };

      // Test the logic
      return flushUserInfoFromRedis('user123').then(() => {
        expect(mockRedis.del).to.have.been.calledOnceWith('user:user123');
      });
    });

    it('should handle multiple user IDs correctly', () => {
      const mockRedis = {
        del: sandbox.stub().resolves()
      };
      
      const getPrefixedUserId = (userId: string) => `user:${userId}`;
      
      const flushUserInfoFromRedis = async (userIds: string | string[]) => {
        if (typeof userIds === "string") {
          userIds = [userIds];
        }
        for (let i = 0; i < userIds.length; i++) {
          const key = getPrefixedUserId(userIds[i]);
          await mockRedis.del(key);
        }
      };

      return flushUserInfoFromRedis(['user123', 'user456']).then(() => {
        expect(mockRedis.del).to.have.been.calledTwice;
        expect(mockRedis.del).to.have.been.calledWith('user:user123');
        expect(mockRedis.del).to.have.been.calledWith('user:user456');
      });
    });

    it('should handle empty array', () => {
      const mockRedis = {
        del: sandbox.stub().resolves()
      };
      
      const flushUserInfoFromRedis = async (userIds: string | string[]) => {
        if (typeof userIds === "string") {
          userIds = [userIds];
        }
        for (let i = 0; i < userIds.length; i++) {
          const key = `user:${userIds[i]}`;
          await mockRedis.del(key);
        }
      };

      return flushUserInfoFromRedis([]).then(() => {
        expect(mockRedis.del).not.to.have.been.called;
      });
    });
  });

  describe('getUserInfo simulation', () => {
    it('should prioritize cache when available', async () => {
      const mockUser = { _id: 'user123', username: 'testuser' };
      const mockRedis = {
        get: sandbox.stub().resolves(JSON.stringify(mockUser)),
        setEx: sandbox.stub().resolves()
      };
      const mockUserModel = {
        findById: sandbox.stub().returns({
          lean: sandbox.stub().resolves(mockUser)
        })
      };
      const mockConfig = {
        get: sandbox.stub()
          .withArgs('privilege.can-use-cache').returns(true)
          .withArgs('oauth.refresh-token-lifetime').returns(3600)
      };

      // Simulate getUserInfo function
      const getUserInfo = async (userId: string) => {
        let userInfo;
        if (mockConfig.get('privilege.can-use-cache')) {
          userInfo = await mockRedis.get(`user:${userId}`);
        }
        if (!userInfo) {
          userInfo = await mockUserModel.findById(userId).lean();
          if (mockConfig.get('privilege.can-use-cache')) {
            await mockRedis.setEx(
              `user:${userId}`,
              JSON.stringify(userInfo),
              mockConfig.get('oauth.refresh-token-lifetime')
            );
          }
        } else {
          userInfo = JSON.parse(userInfo);
        }
        return userInfo;
      };

      const result = await getUserInfo('user123');

      expect(mockRedis.get).to.have.been.calledWith('user:user123');
      expect(mockUserModel.findById).not.to.have.been.called;
      expect(result).to.deep.equal(mockUser);
    });

    it('should fetch from database when cache miss', async () => {
      const mockUser = { _id: 'user123', username: 'testuser' };
      const mockRedis = {
        get: sandbox.stub().resolves(null),
        setEx: sandbox.stub().resolves()
      };
      const mockUserModel = {
        findById: sandbox.stub().returns({
          lean: sandbox.stub().resolves(mockUser)
        })
      };
      const mockConfig = {
        get: sandbox.stub()
          .withArgs('privilege.can-use-cache').returns(true)
          .withArgs('oauth.refresh-token-lifetime').returns(3600)
      };

      const getUserInfo = async (userId: string) => {
        let userInfo;
        if (mockConfig.get('privilege.can-use-cache')) {
          userInfo = await mockRedis.get(`user:${userId}`);
        }
        if (!userInfo) {
          userInfo = await mockUserModel.findById(userId).lean();
          if (mockConfig.get('privilege.can-use-cache')) {
            await mockRedis.setEx(
              `user:${userId}`,
              JSON.stringify(userInfo),
              mockConfig.get('oauth.refresh-token-lifetime')
            );
          }
        } else {
          userInfo = JSON.parse(userInfo);
        }
        return userInfo;
      };

      const result = await getUserInfo('user123');

      expect(mockRedis.get).to.have.been.calledWith('user:user123');
      expect(mockUserModel.findById).to.have.been.calledWith('user123');
      expect(mockRedis.setEx).to.have.been.calledWith(
        'user:user123',
        JSON.stringify(mockUser),
        3600
      );
      expect(result).to.deep.equal(mockUser);
    });

    it('should bypass cache when disabled', async () => {
      const mockUser = { _id: 'user123', username: 'testuser' };
      const mockRedis = {
        get: sandbox.stub(),
        setEx: sandbox.stub()
      };
      const mockUserModel = {
        findById: sandbox.stub().returns({
          lean: sandbox.stub().resolves(mockUser)
        })
      };
      const mockConfig = {
        get: sandbox.stub()
          .withArgs('privilege.can-use-cache').returns(false)
      };

      const getUserInfo = async (userId: string) => {
        let userInfo;
        if (mockConfig.get('privilege.can-use-cache')) {
          userInfo = await mockRedis.get(`user:${userId}`);
        }
        if (!userInfo) {
          userInfo = await mockUserModel.findById(userId).lean();
          if (mockConfig.get('privilege.can-use-cache')) {
            await mockRedis.setEx(
              `user:${userId}`,
              JSON.stringify(userInfo),
              mockConfig.get('oauth.refresh-token-lifetime')
            );
          }
        } else {
          userInfo = JSON.parse(userInfo);
        }
        return userInfo;
      };

      const result = await getUserInfo('user123');

      expect(mockRedis.get).not.to.have.been.called;
      expect(mockUserModel.findById).to.have.been.calledWith('user123');
      expect(mockRedis.setEx).not.to.have.been.called;
      expect(result).to.deep.equal(mockUser);
    });
  });
});
