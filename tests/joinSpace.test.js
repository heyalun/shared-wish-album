const { main: joinSpace } = require('../cloudfunctions/joinSpace');
const { main: createSpace } = require('../cloudfunctions/createSpace');

describe('joinSpace', () => {
  test('joins an existing space by invite code', async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    const inviteCode = created.data.space.inviteCode;

    global.cloud._openid = 'another-user';
    const result = await joinSpace({ inviteCode }, {});
    expect(result.data.space).toBeDefined();
    expect(result.data.space.members).toContain('another-user');
    expect(result.data.space.members).toContain('mock-openid-123');
  });

  test('rejects invalid invite code', async () => {
    await expect(joinSpace({ inviteCode: 'ZZZZZZ' }, {})).rejects.toThrow('邀请码无效');
  });

  test('rejects missing invite code', async () => {
    await expect(joinSpace({}, {})).rejects.toThrow('邀请码无效');
  });

  test('prevents duplicate join', async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    const inviteCode = created.data.space.inviteCode;

    global.cloud._openid = 'same-user';
    await joinSpace({ inviteCode }, {});
    await expect(joinSpace({ inviteCode }, {})).rejects.toThrow('你已在该空间中');
  });
});
