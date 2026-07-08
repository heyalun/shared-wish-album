const { main: uploadPhoto } = require('../cloudfunctions/uploadPhoto');
const { main: createSpace } = require('../cloudfunctions/createSpace');

describe('uploadPhoto', () => {
  let spaceId;

  beforeEach(async () => {
    const created = await createSpace({ name: '测试空间' }, {});
    spaceId = created.data.space._id;
  });

  test('uploads a photo and creates record', async () => {
    const result = await uploadPhoto({
      spaceId,
      imageUrl: 'cloud://test-path/test.jpg',
      takenAt: Date.now(),
      locationName: '南京',
      caption: '美好的一天'
    }, {});

    expect(result.data.photo).toBeDefined();
    expect(result.data.photo.spaceId).toBe(spaceId);
    expect(result.data.photo.uploaderId).toBe('mock-openid-123');
    expect(result.data.photo.imageUrl).toBe('cloud://test-path/test.jpg');
    expect(result.data.photo.locationName).toBe('南京');
    expect(result.data.photo.caption).toBe('美好的一天');
  });

  test('accepts optional location fields', async () => {
    const result = await uploadPhoto({
      spaceId,
      imageUrl: 'cloud://test-path/test.jpg',
      takenAt: Date.now()
    }, {});

    expect(result.data.photo.locationName).toBeUndefined();
    expect(result.data.photo.caption).toBeUndefined();
  });

  test('rejects missing spaceId', async () => {
    await expect(uploadPhoto({ imageUrl: 'cloud://test.jpg', takenAt: Date.now() }, {}))
      .rejects.toThrow('空间ID不能为空');
  });

  test('rejects missing takenAt', async () => {
    await expect(uploadPhoto({ spaceId, imageUrl: 'cloud://test.jpg' }, {}))
      .rejects.toThrow('拍摄时间不能为空');
  });
});