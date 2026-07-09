const { main: getStats } = require('../miniprogram/cloudfunctions/getStats');
const { main: createSpace } = require('../miniprogram/cloudfunctions/createSpace');
const { main: uploadPhoto } = require('../miniprogram/cloudfunctions/uploadPhoto');
const { main: createWish } = require('../miniprogram/cloudfunctions/createWish');

describe('getStats', () => {
  test('returns empty array when no spaces exist', async () => {
    const result = await getStats({}, {});
    expect(result.data.spaces).toEqual([]);
  });

  test('returns space stats with counts', async () => {
    const space = await createSpace({ name: '空间A' }, {});
    const spaceId = space.data.space._id;
    await uploadPhoto({ spaceId, imageUrl: 'cloud://a.jpg', takenAt: Date.now() }, {});
    await uploadPhoto({ spaceId, imageUrl: 'cloud://b.jpg', takenAt: Date.now() }, {});
    await createWish({ spaceId, title: '心愿1', type: 'food' }, {});
    await createWish({ spaceId, title: '心愿2', type: 'travel' }, {});
    await createWish({ spaceId, title: '心愿3', type: 'other' }, {});
    const result = await getStats({}, {});
    expect(result.data.spaces.length).toBe(1);
    expect(result.data.spaces[0].name).toBe('空间A');
    expect(result.data.spaces[0].memberCount).toBe(1);
    expect(result.data.spaces[0].photoCount).toBe(2);
    expect(result.data.spaces[0].wishCount).toBe(3);
  });

  test('returns multiple spaces', async () => {
    await createSpace({ name: '空间A' }, {});
    await createSpace({ name: '空间B' }, {});
    const result = await getStats({}, {});
    expect(result.data.spaces.length).toBe(2);
  });
});
