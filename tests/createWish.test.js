const { main: createWish } = require('../cloudfunctions/createWish');
const { main: createSpace } = require('../cloudfunctions/createSpace');

describe('createWish', () => {
  let spaceId;

  beforeEach(async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    spaceId = created.data.space._id;
  });

  test('creates a wish with food type', async () => {
    const result = await createWish({ spaceId, title: '吃南京大排档', type: 'food' }, {});
    expect(result.data.wish).toBeDefined();
    expect(result.data.wish.spaceId).toBe(spaceId);
    expect(result.data.wish.title).toBe('吃南京大排档');
    expect(result.data.wish.type).toBe('food');
    expect(result.data.wish.done).toBe(false);
    expect(result.data.wish.creatorId).toBe('mock-openid-123');
  });

  test('creates a wish with travel type', async () => {
    const result = await createWish({ spaceId, title: '去日本', type: 'travel', location: '日本东京', note: '春天去看樱花' }, {});
    expect(result.data.wish.type).toBe('travel');
    expect(result.data.wish.location).toBe('日本东京');
    expect(result.data.wish.note).toBe('春天去看樱花');
  });

  test('rejects empty title', async () => {
    await expect(createWish({ spaceId, title: '', type: 'food' }, {}))
      .rejects.toThrow('心愿标题不能为空');
  });

  test('rejects title longer than 100 characters', async () => {
    const longTitle = 'a'.repeat(101);
    await expect(createWish({ spaceId, title: longTitle, type: 'food' }, {}))
      .rejects.toThrow('心愿标题不能超过100字');
  });

  test('rejects invalid type', async () => {
    await expect(createWish({ spaceId, title: '测试', type: 'invalid' }, {}))
      .rejects.toThrow('心愿类型无效');
  });

  test('rejects missing type', async () => {
    await expect(createWish({ spaceId, title: '测试' }, {}))
      .rejects.toThrow('心愿类型不能为空');
  });
});
