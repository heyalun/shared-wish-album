const { main } = require('../cloudfunctions/createSpace');

describe('createSpace', () => {
  test('creates a space with a 6-character invite code', async () => {
    const result = await main({ name: '我们的空间' }, {});
    expect(result.data.space).toBeDefined();
    expect(result.data.space.name).toBe('我们的空间');
    expect(result.data.space.inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.data.space.members).toContain('mock-openid-123');
    expect(result.data.space.creatorId).toBe('mock-openid-123');
  });

  test('rejects empty space name', async () => {
    await expect(main({ name: '' }, {})).rejects.toThrow('空间名称不能为空');
  });

  test('rejects missing name', async () => {
    await expect(main({}, {})).rejects.toThrow('空间名称不能为空');
  });

  test('generates unique invite codes', async () => {
    const result1 = await main({ name: '空间A' }, {});
    const result2 = await main({ name: '空间B' }, {});
    expect(result1.data.space.inviteCode).not.toBe(result2.data.space.inviteCode);
  });
});
