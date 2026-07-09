const { main: completeWish } = require('../miniprogram/cloudfunctions/completeWish');
const { main: createSpace } = require('../miniprogram/cloudfunctions/createSpace');
const { main: createWish } = require('../miniprogram/cloudfunctions/createWish');

describe('completeWish', () => {
  let spaceId;
  beforeEach(async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    spaceId = created.data.space._id;
  });

  test('marks a wish as done', async () => {
    const wish = await createWish({ spaceId, title: '心愿', type: 'food' }, {});
    const result = await completeWish({ wishId: wish.data.wish._id }, {});
    expect(result.data.wish.done).toBe(true);
    expect(result.data.wish.doneAt).toBeDefined();
    expect(result.data.wish.doneBy).toBe('mock-openid-123');
  });

  test('links photos to completed wish', async () => {
    const wish = await createWish({ spaceId, title: '心愿', type: 'food' }, {});
    const result = await completeWish({ wishId: wish.data.wish._id, linkedPhotoIds: ['photo-1', 'photo-2'] }, {});
    expect(result.data.wish.linkedPhotoIds).toEqual(['photo-1', 'photo-2']);
  });

  test('rejects completing an already done wish', async () => {
    const wish = await createWish({ spaceId, title: '心愿', type: 'food' }, {});
    await completeWish({ wishId: wish.data.wish._id }, {});
    await expect(completeWish({ wishId: wish.data.wish._id }, {}))
      .rejects.toThrow('心愿已完成');
  });

  test('rejects non-existent wish', async () => {
    await expect(completeWish({ wishId: 'non-existent' }, {}))
      .rejects.toThrow('心愿不存在');
  });
});
