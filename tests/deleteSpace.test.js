const { main: deleteSpace } = require('../miniprogram/cloudfunctions/deleteSpace');
const { main: createSpace } = require('../miniprogram/cloudfunctions/createSpace');
const { main: uploadPhoto } = require('../miniprogram/cloudfunctions/uploadPhoto');
const { main: createWish } = require('../miniprogram/cloudfunctions/createWish');

describe('deleteSpace', () => {
  test('deletes own space and associated data', async () => {
    const space = await createSpace({ name: '测试空间' }, {});
    const spaceId = space.data.space._id;

    await uploadPhoto({ spaceId, imageUrl: 'cloud://test.jpg', takenAt: Date.now() }, {});
    await createWish({ spaceId, title: '心愿', type: 'food' }, {});

    const result = await deleteSpace({ spaceId }, {});
    expect(result.data.success).toBe(true);

    const db = global.cloud.database();
    const spaceCheck = await db.collection('spaces').doc(spaceId).get();
    expect(spaceCheck.data).toBeNull();

    const photos = await db.collection('photos').where({ spaceId }).get();
    expect(photos.data.length).toBe(0);

    const wishes = await db.collection('wishes').where({ spaceId }).get();
    expect(wishes.data.length).toBe(0);
  });

  test('rejects deleting non-existent space', async () => {
    await expect(deleteSpace({ spaceId: 'non-existent' }, {})).rejects.toThrow('空间不存在');
  });

  test('rejects missing spaceId', async () => {
    await expect(deleteSpace({}, {})).rejects.toThrow('空间ID不能为空');
  });

  test('rejects non-creator deleting space', async () => {
    const space = await createSpace({ name: '测试空间' }, {});
    const spaceId = space.data.space._id;

    global.cloud._openid = 'another-user';
    await expect(deleteSpace({ spaceId }, {})).rejects.toThrow('只有创建者可以删除空间');
  });
});