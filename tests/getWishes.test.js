const { main: getWishes } = require('../cloudfunctions/getWishes');
const { main: createSpace } = require('../cloudfunctions/createSpace');
const { main: createWish } = require('../cloudfunctions/createWish');

describe('getWishes', () => {
  let spaceId;

  beforeEach(async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    spaceId = created.data.space._id;
  });

  test('returns empty array when no wishes exist', async () => {
    const result = await getWishes({ spaceId }, {});
    expect(result.data.wishes).toEqual([]);
  });

  test('returns all wishes for a space', async () => {
    await createWish({ spaceId, title: '心愿1', type: 'food' }, {});
    await createWish({ spaceId, title: '心愿2', type: 'travel' }, {});
    await createWish({ spaceId, title: '心愿3', type: 'other' }, {});

    const result = await getWishes({ spaceId }, {});
    expect(result.data.wishes.length).toBe(3);
  });

  test('filters by done status', async () => {
    const w1 = await createWish({ spaceId, title: '心愿1', type: 'food' }, {});
    await createWish({ spaceId, title: '心愿2', type: 'travel' }, {});
    const { main: completeWish } = require('../cloudfunctions/completeWish');
    await completeWish({ wishId: w1.data.wish._id }, {});

    const active = await getWishes({ spaceId, done: false }, {});
    expect(active.data.wishes.length).toBe(1);

    const completed = await getWishes({ spaceId, done: true }, {});
    expect(completed.data.wishes.length).toBe(1);
  });
});
