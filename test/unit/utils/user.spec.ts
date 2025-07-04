import { expect } from 'chai';
import sinon from 'sinon';
import { 
  isFollowing, 
  sanitizeEditableFields, 
  hydrateUserProfile, 
  stripSensitiveFieldsForNonFollowerGet,
  UserHydrationOptions
} from '../../../src/utils/user';
import { Configuration } from '../../../src/singleton/configuration';
import FollowModel from '../../../src/model/mongo/follow';
import UserModel, { UserInterface } from '../../../src/model/mongo/user';
import * as subscriptionUtils from '../../../src/utils/subscription';
import * as profilePictureUtils from '../../../src/utils/profile-picture';

describe('User Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isFollowing', () => {
    let configStub: sinon.SinonStub;
    let followModelStub: sinon.SinonStub;
    let userModelStub: sinon.SinonStub;

    beforeEach(() => {
      configStub = sandbox.stub(Configuration, 'get');
      followModelStub = sandbox.stub(FollowModel, 'findOne');
      userModelStub = sandbox.stub(UserModel, 'findOne');
    });

    it('should return empty results when follow APIs are disabled', async () => {
      configStub.withArgs('privilege.can-use-follow-apis').returns(false);

      const result = await isFollowing({
        sourceId: 'source123',
        targets: [{ _id: 'target123' } as unknown as UserInterface]
      });

      expect(result).to.deep.equal({
        results: [],
        positiveIndices: [],
        negativeIndices: []
      });
    });

    it('should handle targets with existing follow entries', async () => {
      configStub.withArgs('privilege.can-use-follow-apis').returns(true);
      
      const mockUser = { _id: 'target123', username: 'testuser' } as unknown as UserInterface;
      const mockFollowEntry = { 
        targetId: 'target123', 
        sourceId: 'source123', 
        approved: true 
      };

      followModelStub.returns({
        lean: () => ({
          exec: () => Promise.resolve(mockFollowEntry)
        })
      });

      const result = await isFollowing({
        sourceId: 'source123',
        targets: [mockUser]
      });

      expect(result.results).to.deep.equal([true]);
      expect(result.positiveIndices).to.deep.equal([0]);
      expect(result.negativeIndices).to.deep.equal([]);
    });

    it('should handle targets with unapproved follow requests', async () => {
      configStub.withArgs('privilege.can-use-follow-apis').returns(true);
      
      const mockUser = { _id: 'target123', username: 'testuser' } as unknown as UserInterface;
      const mockFollowEntry = { 
        targetId: 'target123', 
        sourceId: 'source123', 
        approved: false 
      };

      followModelStub.returns({
        lean: () => ({
          exec: () => Promise.resolve(mockFollowEntry)
        })
      });

      const result = await isFollowing({
        sourceId: 'source123',
        targets: [mockUser]
      });

      expect(result.results).to.deep.equal([false]);
      expect(result.positiveIndices).to.deep.equal([]);
      expect(result.negativeIndices).to.deep.equal([0]);
    });

    it('should handle targets with no follow entries', async () => {
      configStub.withArgs('privilege.can-use-follow-apis').returns(true);
      
      const mockUser = { _id: 'target123', username: 'testuser' } as unknown as UserInterface;

      followModelStub.returns({
        lean: () => ({
          exec: () => Promise.resolve(null)
        })
      });

      const result = await isFollowing({
        sourceId: 'source123',
        targets: [mockUser]
      });

      expect(result.results).to.deep.equal([false]);
      expect(result.positiveIndices).to.deep.equal([]);
      expect(result.negativeIndices).to.deep.equal([0]);
    });

    it('should handle targetIds by fetching users from database', async () => {
      configStub.withArgs('privilege.can-use-follow-apis').returns(true);
      
      const mockUser = { _id: 'target123', username: 'testuser' } as unknown as UserInterface;

      userModelStub.returns({
        lean: () => ({
          exec: () => Promise.resolve(mockUser)
        })
      });

      followModelStub.returns({
        lean: () => ({
          exec: () => Promise.resolve(null)
        })
      });

      const result = await isFollowing({
        sourceId: 'source123',
        targetIds: ['target123']
      });

      expect(result.results).to.deep.equal([false]);
      expect(userModelStub.calledOnce).to.be.true;
    });
  });

  describe('sanitizeEditableFields', () => {
    let configGetStub: sinon.SinonStub;
    let configSetStub: sinon.SinonStub;

    beforeEach(() => {
      configGetStub = sandbox.stub(Configuration, 'get');
      configSetStub = sandbox.stub(Configuration, 'set');
    });

    it('should filter out blocked fields from editable fields', () => {
      const editableFields = ['username', 'email', '2faEnabled', 'credits'];
      const adminEditableFields = ['bio', 'verified', 'customData'];

      configGetStub.withArgs('user.profile.editable-fields').returns(editableFields);
      configGetStub.withArgs('admin-api.user.profile.editable-fields').returns(adminEditableFields);

      sanitizeEditableFields();

      expect(configSetStub.calledWith('user.profile.editable-fields', 'username,email')).to.be.true;
      expect(configSetStub.calledWith('admin-api.user.profile.editable-fields', 'bio')).to.be.true;
    });

    it('should not modify configuration if no blocked fields are present', () => {
      const editableFields = ['username', 'email', 'bio'];
      const adminEditableFields = ['bio', 'firstName'];

      configGetStub.withArgs('user.profile.editable-fields').returns(editableFields);
      configGetStub.withArgs('admin-api.user.profile.editable-fields').returns(adminEditableFields);

      sanitizeEditableFields();

      expect(configSetStub.called).to.be.false;
    });
  });

  describe('hydrateUserProfile', () => {
    let configStub: sinon.SinonStub;

    beforeEach(() => {
      configStub = sandbox.stub(Configuration, 'get');
      // Note: Due to ES module limitations, we can't easily stub checkSubscription and attachProfilePicture
      // These tests focus on testing the core logic without external dependencies
    });

    it('should return dummy user for deleted/banned users in delegated mode', async () => {
      const user = { 
        _id: 'user123', 
        isDeleted: true, 
        isBanned: false,
        customData: '{"test": true}'
      } as unknown as UserInterface;

      await hydrateUserProfile(user, { delegatedMode: true });

      // In delegated mode, deleted users should have properties stripped except _id, isDeleted, isBanned
      expect(user._id).to.equal('user123');
      expect(user.isDeleted).to.be.true;
      expect(user.isBanned).to.be.false;
      expect(user.customData).to.equal('{}');
    });

    it.skip('should hydrate user profile with subscription and profile picture', async () => {
      // Skipped due to ES module stubbing limitations
      // This test would verify that checkSubscription and attachProfilePicture are called
      // and that custom data is properly parsed when conditions are met
    });

    it.skip('should skip custom data hydration when disabled for self retrieval', async () => {
      // Skipped due to ES module stubbing limitations  
      // This test would verify that custom data is not hydrated when configuration disables it
    });

    it.skip('should skip custom data hydration when disabled for delegated mode', async () => {
      // Skipped due to ES module stubbing limitations
      // This test would verify that custom data is not hydrated in delegated mode when disabled
    });

    it.skip('should handle array of users', async () => {
      // Skipped due to ES module stubbing limitations
      // This test would verify that hydration is applied to all users in an array
    });
  });

  describe('stripSensitiveFieldsForNonFollowerGet', () => {
    let configStub: sinon.SinonStub;

    beforeEach(() => {
      configStub = sandbox.stub(Configuration, 'get');
    });

    it('should remove sensitive fields based on configuration', () => {
      const user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        phone: '+1234567890',
        bio: 'Test bio'
      } as unknown as UserInterface;

      configStub.withArgs('user.field-privacy.non-follower.hidden-fields').returns(['email', 'phone']);

      const result = stripSensitiveFieldsForNonFollowerGet(user);

      expect(result.username).to.equal('testuser');
      expect(result.bio).to.equal('Test bio');
      expect((result as any).email).to.be.undefined;
      expect((result as any).phone).to.be.undefined;
    });

    it('should handle empty hidden fields list', () => {
      const user = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com'
      } as unknown as UserInterface;

      configStub.withArgs('user.field-privacy.non-follower.hidden-fields').returns([]);

      const result = stripSensitiveFieldsForNonFollowerGet(user);

      expect(result.username).to.equal('testuser');
      expect((result as any).email).to.equal('test@example.com');
    });
  });
});
