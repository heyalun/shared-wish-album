const fs = require('fs');
const path = require('path');

const tests = {
  'login.test.js': `const { main } = require('../cloudfunctions/login');

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
`,

  'createSpace.test.js': `const { main } = require('../cloudfunctions/createSpace');

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
`,

  'joinSpace.test.js': `const { main: joinSpace } = require('../cloudfunctions/joinSpace');
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
`,

  'uploadPhoto.test.js': `const { main: uploadPhoto } = require('../cloudfunctions/uploadPhoto');
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
`,

  'getPhotos.test.js': `const { main: getPhotos } = require('../cloudfunctions/getPhotos');
const { main: createSpace } = require('../cloudfunctions/createSpace');
const { main: uploadPhoto } = require('../cloudfunctions/uploadPhoto');

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
`,

  'createWish.test.js': `const { main: createWish } = require('../cloudfunctions/createWish');
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
`,

  'getWishes.test.js': `const { main: getWishes } = require('../cloudfunctions/getWishes');
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
`,

  'completeWish.test.js': `const { main: completeWish } = require('../cloudfunctions/completeWish');
const { main: createSpace } = require('../cloudfunctions/createSpace');
const { main: createWish } = require('../cloudfunctions/createWish');

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
    const result = await completeWish({
      wishId: wish.data.wish._id,
      linkedPhotoIds: ['photo-1', 'photo-2']
    }, {});

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
`,

  'getStats.test.js': `const { main: getStats } = require('../cloudfunctions/getStats');
const { main: createSpace } = require('../cloudfunctions/createSpace');
const { main: uploadPhoto } = require('../cloudfunctions/uploadPhoto');
const { main: createWish } = require('../cloudfunctions/createWish');

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
`
};

const testDir = path.join(__dirname, 'tests');
for (const [filename, content] of Object.entries(tests)) {
  fs.writeFileSync(path.join(testDir, filename), content, 'utf8');
  console.log('wrote ' + filename);
}