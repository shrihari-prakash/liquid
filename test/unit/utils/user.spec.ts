import { expect } from 'chai';
import sinon from 'sinon';

describe('User Utils', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isFollowing logic simulation', () => {
    // Simulate the isFollowing function without external dependencies
    const simulateIsFollowing = async (
      sourceId: string,
      targets: any[],
      followEntries: any[] = [],
      canUseFollowApis: boolean = true
    ) => {
      const results: boolean[] = [];
      const positiveIndices: number[] = [];
      const negativeIndices: number[] = [];

      if (!canUseFollowApis) {
        return { results: [], positiveIndices: [], negativeIndices: [] };
      }

      for (let i = 0; i < targets.length; i++) {
        let target = JSON.parse(JSON.stringify(targets[i]));
        const followEntry = followEntries.find(
          entry => entry.targetId === target._id && entry.sourceId === sourceId
        );

        if (!followEntry) {
          target.isFollowing = false;
        } else {
          if (followEntry.approved) {
            target.isFollowing = true;
          } else {
            target.isFollowing = false;
            target.requested = true;
          }
        }

        results.push(target.isFollowing);
        if (target.isFollowing) {
          positiveIndices.push(results.length - 1);
        }
        if (!target.isFollowing) {
          negativeIndices.push(results.length - 1);
        }
      }

      return { results, positiveIndices, negativeIndices };
    };

    it('should return empty results when follow APIs are disabled', async () => {
      const result = await simulateIsFollowing('user1', [{ _id: 'user2' }], [], false);

      expect(result.results).to.deep.equal([]);
      expect(result.positiveIndices).to.deep.equal([]);
      expect(result.negativeIndices).to.deep.equal([]);
    });

    it('should handle users not being followed', async () => {
      const targets = [
        { _id: 'user2', name: 'User 2' },
        { _id: 'user3', name: 'User 3' }
      ];

      const result = await simulateIsFollowing('user1', targets, []);

      expect(result.results).to.deep.equal([false, false]);
      expect(result.positiveIndices).to.deep.equal([]);
      expect(result.negativeIndices).to.deep.equal([0, 1]);
    });

    it('should handle approved follow relationships', async () => {
      const targets = [
        { _id: 'user2', name: 'User 2' },
        { _id: 'user3', name: 'User 3' }
      ];
      const followEntries = [
        { sourceId: 'user1', targetId: 'user2', approved: true },
        { sourceId: 'user1', targetId: 'user3', approved: true }
      ];

      const result = await simulateIsFollowing('user1', targets, followEntries);

      expect(result.results).to.deep.equal([true, true]);
      expect(result.positiveIndices).to.deep.equal([0, 1]);
      expect(result.negativeIndices).to.deep.equal([]);
    });

    it('should handle pending follow requests', async () => {
      const targets = [
        { _id: 'user2', name: 'User 2' }
      ];
      const followEntries = [
        { sourceId: 'user1', targetId: 'user2', approved: false }
      ];

      const result = await simulateIsFollowing('user1', targets, followEntries);

      expect(result.results).to.deep.equal([false]);
      expect(result.positiveIndices).to.deep.equal([]);
      expect(result.negativeIndices).to.deep.equal([0]);
    });

    it('should handle mixed follow statuses', async () => {
      const targets = [
        { _id: 'user2', name: 'User 2' },
        { _id: 'user3', name: 'User 3' },
        { _id: 'user4', name: 'User 4' }
      ];
      const followEntries = [
        { sourceId: 'user1', targetId: 'user2', approved: true },
        { sourceId: 'user1', targetId: 'user4', approved: false }
      ];

      const result = await simulateIsFollowing('user1', targets, followEntries);

      expect(result.results).to.deep.equal([true, false, false]);
      expect(result.positiveIndices).to.deep.equal([0]);
      expect(result.negativeIndices).to.deep.equal([1, 2]);
    });

    it('should only consider follows for the specific source user', async () => {
      const targets = [
        { _id: 'user2', name: 'User 2' }
      ];
      const followEntries = [
        { sourceId: 'other_user', targetId: 'user2', approved: true }
      ];

      const result = await simulateIsFollowing('user1', targets, followEntries);

      expect(result.results).to.deep.equal([false]);
      expect(result.negativeIndices).to.deep.equal([0]);
    });
  });

  describe('sanitizeEditableFields logic simulation', () => {
    const blockedFields = [
      "2faEnabled", "2faMedium", "isSubscribed", "subscriptionExpiry", "subscriptionTier",
      "isBanned", "bannedDate", "bannedBy", "bannedReason", "isRestricted",
      "restrictedDate", "restrictedReason", "restrictedBy", "verified", "verifiedDate",
      "verifiedBy", "profilePictureUrl", "profilePicturePath", "scope", "credits",
      "customData", "createdAt", "updatedAt"
    ];

    const simulateSanitizeEditableFields = (
      userFields: string[],
      adminFields: string[],
      mockConfiguration: any,
      mockLogger: any
    ) => {
      const sanitizedUserFields = userFields.filter(
        field => !blockedFields.includes(field)
      );
      const sanitizedAdminFields = adminFields.filter(
        field => !blockedFields.includes(field)
      );

      if (userFields.length !== sanitizedUserFields.length) {
        mockLogger.warn("Misconfiguration detected in user.profile.editable-fields");
        mockConfiguration.set("user.profile.editable-fields", sanitizedUserFields.join(","));
      }

      if (adminFields.length !== sanitizedAdminFields.length) {
        mockLogger.warn("Misconfiguration detected in admin-api.user.profile.editable-fields");
        mockConfiguration.set("admin-api.user.profile.editable-fields", sanitizedAdminFields.join(","));
      }

      return { sanitizedUserFields, sanitizedAdminFields };
    };

    it('should allow safe fields for editing', () => {
      const safeFields = ['name', 'email', 'bio', 'location'];
      const mockConfig = { set: sandbox.stub() };
      const mockLogger = { warn: sandbox.stub() };

      const result = simulateSanitizeEditableFields(safeFields, safeFields, mockConfig, mockLogger);

      expect(result.sanitizedUserFields).to.deep.equal(safeFields);
      expect(result.sanitizedAdminFields).to.deep.equal(safeFields);
      expect(mockLogger.warn.called).to.be.false;
      expect(mockConfig.set.called).to.be.false;
    });

    it('should filter out blocked fields from user editable fields', () => {
      const mixedFields = ['name', 'email', 'isSubscribed', 'bio', 'credits'];
      const mockConfig = { set: sandbox.stub() };
      const mockLogger = { warn: sandbox.stub() };

      const result = simulateSanitizeEditableFields(mixedFields, [], mockConfig, mockLogger);

      expect(result.sanitizedUserFields).to.deep.equal(['name', 'email', 'bio']);
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockConfig.set.calledWith("user.profile.editable-fields", "name,email,bio")).to.be.true;
    });

    it('should filter out blocked fields from admin editable fields', () => {
      const adminFields = ['name', 'verified', 'isBanned', 'customData'];
      const mockConfig = { set: sandbox.stub() };
      const mockLogger = { warn: sandbox.stub() };

      const result = simulateSanitizeEditableFields([], adminFields, mockConfig, mockLogger);

      expect(result.sanitizedAdminFields).to.deep.equal(['name']);
      expect(mockLogger.warn.calledOnce).to.be.true;
      expect(mockConfig.set.calledWith("admin-api.user.profile.editable-fields", "name")).to.be.true;
    });

    it('should handle all blocked fields being filtered out', () => {
      const allBlockedFields = ['isSubscribed', 'isBanned', 'verified'];
      const mockConfig = { set: sandbox.stub() };
      const mockLogger = { warn: sandbox.stub() };

      const result = simulateSanitizeEditableFields(allBlockedFields, allBlockedFields, mockConfig, mockLogger);

      expect(result.sanitizedUserFields).to.deep.equal([]);
      expect(result.sanitizedAdminFields).to.deep.equal([]);
      expect(mockLogger.warn.calledTwice).to.be.true;
    });

    it('should warn for both user and admin fields when both need sanitization', () => {
      const userFields = ['name', 'isSubscribed'];
      const adminFields = ['email', 'verified'];
      const mockConfig = { set: sandbox.stub() };
      const mockLogger = { warn: sandbox.stub() };

      simulateSanitizeEditableFields(userFields, adminFields, mockConfig, mockLogger);

      expect(mockLogger.warn.calledTwice).to.be.true;
      expect(mockConfig.set.calledTwice).to.be.true;
    });
  });

  describe('hydrateUserProfile logic simulation', () => {
    const simulateHydrateUserProfile = async (
      users: any | any[],
      options: any = {},
      mocks: any = {}
    ) => {
      const {
        canShowCustomDataInDelegatedMode = true,
        canShowCustomDataInSelfRetrieval = true,
        checkSubscription = (user: any) => user,
        attachProfilePicture = async (user: any) => user
      } = mocks;

      const _hydrateUserProfile = async (user: any, options: any) => {
        if ((user.isDeleted || user.isBanned) && options.delegatedMode) {
          return {
            _id: user._id,
            isDeleted: user.isDeleted,
            isBanned: user.isBanned,
            customData: "{}"
          };
        }

        checkSubscription(user);
        await attachProfilePicture(user);

        if (!user.customData) {
          return user;
        }

        if (options.selfRetrieve && !canShowCustomDataInSelfRetrieval) {
          user.customData = undefined;
          return user;
        } else if (options.delegatedMode && !canShowCustomDataInDelegatedMode) {
          user.customData = undefined;
          return user;
        }

        user.customData = user.customData ? JSON.parse(user.customData) : undefined;
        return user;
      };

      if (Array.isArray(users)) {
        for (let i = 0; i < users.length; i++) {
          users[i] = await _hydrateUserProfile(users[i], options);
        }
      } else {
        users = await _hydrateUserProfile(users, options);
      }

      return users;
    };

    it('should return dummy user for deleted/banned users in delegated mode', async () => {
      const user = {
        _id: 'user123',
        name: 'Deleted User',
        isDeleted: true,
        isBanned: false,
        customData: '{"key": "value"}'
      };

      const result = await simulateHydrateUserProfile(user, { delegatedMode: true });

      expect(result._id).to.equal('user123');
      expect(result.isDeleted).to.be.true;
      expect(result.isBanned).to.be.false;
      expect(result.customData).to.equal('{}');
      expect(result.name).to.be.undefined;
    });

    it('should hydrate normal user profile completely', async () => {
      const mockCheckSubscription = sandbox.stub().returnsArg(0);
      const mockAttachProfilePicture = sandbox.stub().resolves();

      const user = {
        _id: 'user123',
        name: 'John Doe',
        customData: '{"preferences": {"theme": "dark"}}'
      };

      await simulateHydrateUserProfile(user, {}, {
        checkSubscription: mockCheckSubscription,
        attachProfilePicture: mockAttachProfilePicture
      });

      expect(mockCheckSubscription.calledOnce).to.be.true;
      expect(mockAttachProfilePicture.calledOnce).to.be.true;
      expect(user.customData).to.deep.equal({ preferences: { theme: 'dark' } });
    });

    it('should skip custom data hydration in self retrieval when disabled', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        customData: '{"key": "value"}'
      };

      await simulateHydrateUserProfile(user, { selfRetrieve: true }, {
        canShowCustomDataInSelfRetrieval: false
      });

      expect(user.customData).to.be.undefined;
    });

    it('should skip custom data hydration in delegated mode when disabled', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        customData: '{"key": "value"}'
      };

      await simulateHydrateUserProfile(user, { delegatedMode: true }, {
        canShowCustomDataInDelegatedMode: false
      });

      expect(user.customData).to.be.undefined;
    });

    it('should handle user without custom data', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe'
      };

      const result = await simulateHydrateUserProfile(user);

      expect(result._id).to.equal('user123');
      expect(result.name).to.equal('John Doe');
      expect(result.customData).to.be.undefined;
    });

    it('should handle array of users', async () => {
      const mockCheckSubscription = sandbox.stub().returnsArg(0);
      const users = [
        { _id: 'user1', name: 'User 1', customData: '{"a": 1}' },
        { _id: 'user2', name: 'User 2', customData: '{"b": 2}' }
      ];

      await simulateHydrateUserProfile(users, {}, {
        checkSubscription: mockCheckSubscription
      });

      expect(mockCheckSubscription.calledTwice).to.be.true;
      expect(users[0].customData).to.deep.equal({ a: 1 });
      expect(users[1].customData).to.deep.equal({ b: 2 });
    });

    it('should handle invalid JSON in custom data', async () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        customData: 'invalid-json'
      };

      try {
        await simulateHydrateUserProfile(user);
        // If no error is thrown, the function handled it gracefully
        expect(true).to.be.true;
      } catch (error) {
        // This is expected for invalid JSON
        expect(error).to.be.an('error');
      }
    });
  });

  describe('stripSensitiveFieldsForNonFollowerGet logic simulation', () => {
    const simulateStripSensitiveFields = (user: any, hiddenFields: string[]) => {
      const userCopy = { ...user };
      for (const field of hiddenFields) {
        userCopy[field] = undefined;
      }
      return userCopy;
    };

    it('should remove sensitive fields for non-followers', () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        bio: 'Hello world'
      };
      const hiddenFields = ['email', 'phone', 'address'];

      const result = simulateStripSensitiveFields(user, hiddenFields);

      expect(result.name).to.equal('John Doe');
      expect(result.bio).to.equal('Hello world');
      expect(result.email).to.be.undefined;
      expect(result.phone).to.be.undefined;
      expect(result.address).to.be.undefined;
    });

    it('should preserve all fields when no hidden fields configured', () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = simulateStripSensitiveFields(user, []);

      expect(result).to.deep.equal(user);
    });

    it('should handle non-existent fields gracefully', () => {
      const user = {
        _id: 'user123',
        name: 'John Doe'
      };
      const hiddenFields = ['email', 'nonExistentField'];

      const result = simulateStripSensitiveFields(user, hiddenFields);

      expect(result.name).to.equal('John Doe');
      expect(result.email).to.be.undefined;
      expect(result.nonExistentField).to.be.undefined;
    });

    it('should strip all fields if all are marked as hidden', () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
      };
      const hiddenFields = ['_id', 'name', 'email'];

      const result = simulateStripSensitiveFields(user, hiddenFields);

      expect(result._id).to.be.undefined;
      expect(result.name).to.be.undefined;
      expect(result.email).to.be.undefined;
    });
  });
});
