const { main: getPhotos } = require('../miniprogram/cloudfunctions/getPhotos');
const { main: createSpace } = require('../miniprogram/cloudfunctions/createSpace');
const { main: uploadPhoto } = require('../miniprogram/cloudfunctions/uploadPhoto');

describe('getPhotos', () => {
  let spaceId;
  beforeEach(async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    spaceId = created.data.space._id;
  });

  test('returns empty array for space with no photos', async () => {
    const result = await getPhotos({ spaceId }, {});
    expect(result.data.photos).toEqual([]);
    expect(result.data.hasMore).toBe(false);
  });

  test('returns photos sorted by createdAt desc', async () => {
    await uploadPhoto({ spaceId, imageUrl: 'cloud://a.jpg', takenAt: 1000 }, {});
    await uploadPhoto({ spaceId, imageUrl: 'cloud://b.jpg', takenAt: 2000 }, {});
    await uploadPhoto({ spaceId, imageUrl: 'cloud://c.jpg', takenAt: 3000 }, {});
    const result = await getPhotos({ spaceId }, {});
    expect(result.data.photos.length).toBe(3);
    expect(result.data.photos[0].imageUrl).toContain('c.jpg');
    expect(result.data.photos[1].imageUrl).toContain('b.jpg');
    expect(result.data.photos[2].imageUrl).toContain('a.jpg');
  });

  test('supports pagination with pageSize', async () => {
    for (let i = 0; i < 25; i++) {
      await uploadPhoto({ spaceId, imageUrl: 'cloud://photo' + i + '.jpg', takenAt: Date.now() + i }, {});
    }
    const result = await getPhotos({ spaceId, pageSize: 20 }, {});
    expect(result.data.photos.length).toBe(20);
    expect(result.data.hasMore).toBe(true);
  });
});
