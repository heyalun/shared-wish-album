const { main } = require('../cloudfunctions/login');

describe('login', () => {
  test('creates a new user on first login', async () => {
    const result = await main({}, {});
    expect(result.data.user).toBeDefined();
    expect(result.data.user.openid).toBe('mock-openid-123');
    expect(result.data.user.nickname).toBe('微信用户');
    expect(result.data.user.createdAt).toBeDefined();
  });

  test('returns existing user on subsequent login', async () => {
    await main({}, {});
    const result = await main({}, {});
    expect(result.data.user.openid).toBe('mock-openid-123');
  });

  test('returns same user id on repeated calls', async () => {
    const first = await main({}, {});
    const second = await main({}, {});
    expect(first.data.user._id).toBe(second.data.user._id);
  });
});