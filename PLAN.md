# 共享心愿相册 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat mini-program for couples/friends/family to share photos and wish lists in private shared spaces, plus a Web admin dashboard.

**Architecture:** WeChat mini-program (native) frontend + WeChat Cloud Development backend (cloud functions, cloud database, cloud storage). Cloud functions are Node.js modules tested with Jest. Web admin is a static HTML page deployed to Vercel calling a cloud function HTTP API.

**Tech Stack:** WeChat Mini Program (native), Node.js (cloud functions), Jest (testing), WeChat Cloud Development (database, storage, functions), Vercel (Web admin hosting)

## Global Constraints

- All cloud functions must be testable with `npm test` using mocked WeChat SDK
- Project root: `D:/vibe-project/`
- No real credentials in code or git history
- TDD: write failing test first, then implementation
- Photo max 10MB, compress to ≤2MB
- Cloud database uses security rules for data isolation by space membership
- Invite codes: 6 alphanumeric characters, globally unique
- Wish title max 100 characters, type must be one of: food/travel/other
- Pagination: 20 items per page for photos
- Cloud function cold start < 5s, home page load < 3s

---

## File Structure

```
D:/vibe-project/
├── SPEC.md
├── PLAN.md
├── README.md
├── package.json
├── jest.config.js
├── .gitlab-ci.yml
├── cloudfunctions/
│   ├── login.js
│   ├── createSpace.js
│   ├── joinSpace.js
│   ├── uploadPhoto.js
│   ├── getPhotos.js
│   ├── createWish.js
│   ├── getWishes.js
│   ├── completeWish.js
│   └── getStats.js
├── miniprogram/
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── utils/
│   │   └── util.js
│   └── pages/
│       ├── index/          (space list)
│       ├── space/          (space home - tabs)
│       ├── photos/         (photo stream)
│       ├── photo-detail/   (photo detail)
│       ├── upload/         (upload photo)
│       ├── wishes/         (wish list)
│       ├── wish-create/    (create wish)
│       ├── wish-detail/    (wish detail + complete)
│       └── space-settings/ (members + invite)
├── web-admin/
│   └── index.html
└── tests/
    ├── setup.js
    ├── login.test.js
    ├── createSpace.test.js
    ├── joinSpace.test.js
    ├── uploadPhoto.test.js
    ├── getPhotos.test.js
    ├── createWish.test.js
    ├── getWishes.test.js
    ├── completeWish.test.js
    └── getStats.test.js
```

### Responsibility per file

| File | Responsibility |
|------|---------------|
| `cloudfunctions/login.js` | Get openid from WXContext, find/create user, return user info |
| `cloudfunctions/createSpace.js` | Generate unique invite code, create space, add creator as member |
| `cloudfunctions/joinSpace.js` | Find space by invite code, add user to members |
| `cloudfunctions/uploadPhoto.js` | Upload image to cloud storage, create photo record |
| `cloudfunctions/getPhotos.js` | Query photos by spaceId with cursor pagination |
| `cloudfunctions/createWish.js` | Validate and create wish record |
| `cloudfunctions/getWishes.js` | Query wishes by spaceId and done status |
| `cloudfunctions/completeWish.js` | Mark wish as done, link photos |
| `cloudfunctions/getStats.js` | Aggregate space statistics (public) |
| `miniprogram/app.js` | Global app initialization, cloud init, user state |
| `miniprogram/pages/index/` | Space list: create/join/switch spaces |
| `miniprogram/pages/space/` | Space home: tabs for photos and wishes |
| `miniprogram/pages/photos/` | Photo stream with pagination |
| `miniprogram/pages/photo-detail/` | Single photo detail view |
| `miniprogram/pages/upload/` | Photo upload form |
| `miniprogram/pages/wishes/` | Wish list by type/status |
| `miniprogram/pages/wish-create/` | Wish creation form |
| `miniprogram/pages/wish-detail/` | Wish detail + complete + link photos |
| `miniprogram/pages/space-settings/` | Members list, invite code display |
| `web-admin/index.html` | Static dashboard showing space stats |
| `tests/` | Jest unit tests for all cloud functions |

---

## Cloud Function Interfaces

### login.js
```
Consumes: (none - uses cloud.getWXContext())
Produces: (data: { user: { _id, openid, nickname, avatarUrl, createdAt } })
```

### createSpace.js
```
Consumes: (event: { name: string })
Produces: (data: { space: { _id, name, creatorId, members: string[], inviteCode, createdAt } })
```

### joinSpace.js
```
Consumes: (event: { inviteCode: string })
Produces: (data: { space: { _id, name, members: string[], ... } })
```

### uploadPhoto.js
```
Consumes: (event: { spaceId: string, imageUrl: string, takenAt: number, locationName?: string, latitude?: number, longitude?: number, caption?: string })
Produces: (data: { photo: { _id, spaceId, uploaderId, imageUrl, takenAt, locationName, caption, createdAt } })
```

### getPhotos.js
```
Consumes: (event: { spaceId: string, pageSize?: number, lastCreatedAt?: number })
Produces: (data: { photos: Array<{ _id, imageUrl, takenAt, locationName, caption, uploaderId, createdAt }>, hasMore: boolean })
```

### createWish.js
```
Consumes: (event: { spaceId: string, title: string, type: 'food'|'travel'|'other', location?: string, note?: string })
Produces: (data: { wish: { _id, spaceId, creatorId, title, type, done, createdAt } })
```

### getWishes.js
```
Consumes: (event: { spaceId: string, done?: boolean })
Produces: (data: { wishes: Array<{ _id, title, type, done, location, note, linkedPhotoIds, creatorId, createdAt }> })
```

### completeWish.js
```
Consumes: (event: { wishId: string, linkedPhotoIds?: string[] })
Produces: (data: { wish: { _id, done, doneAt, doneBy, linkedPhotoIds } })
```

### getStats.js
```
Consumes: (none)
Produces: (data: { spaces: Array<{ _id, name, memberCount: number, photoCount: number, wishCount: number }> })
```

---

### Task 1: Project Scaffolding ✅ **DONE** `27696b4`

**Files:**
- Create: `D:/vibe-project/package.json`
- Create: `D:/vibe-project/jest.config.js`
- Create: `D:/vibe-project/tests/setup.js`
- Create: `D:/vibe-project/.gitignore`
- Create: `D:/vibe-project/.gitlab-ci.yml`

**Interfaces:**
- Produces: `package.json` with jest and test script, `jest.config.js` for Node.js test environment, `tests/setup.js` with WeChat SDK mock

- [ ] **Step 1: Initialize git repo**

```bash
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "shared-wish-album",
  "version": "1.0.0",
  "description": "WeChat mini-program for shared photo albums and wish lists",
  "scripts": {
    "test": "jest --forceExit --detectOpenHandles",
    "test:watch": "jest --watch"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

- [ ] **Step 3: Create jest.config.js**

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['cloudfunctions/**/*.js'],
  coverageDirectory: 'coverage'
};
```

- [ ] **Step 4: Create tests/setup.js with WeChat SDK mock**

```javascript
const mockDatabase = {
  _collections: {},
  command: {
    lt: (val) => ({ $lt: val }),
    gt: (val) => ({ $gt: val }),
    eq: (val) => ({ $eq: val }),
    in: (val) => ({ $in: val }),
    neq: (val) => ({ $neq: val })
  },
  collection(name) {
    if (!this._collections[name]) {
      this._collections[name] = {
        _docs: [],
        _nextId: 1,
        add({ data }) {
          const doc = { _id: String(this._nextId++), ...data };
          this._docs.push(doc);
          return Promise.resolve({ _id: doc._id });
        },
        doc(id) {
          const self = this;
          return {
            get() {
              const doc = self._docs.find(d => d._id === id);
              return Promise.resolve({ data: doc ? [doc] : [] });
            },
            update({ data }) {
              const idx = self._docs.findIndex(d => d._id === id);
              if (idx !== -1) {
                Object.assign(self._docs[idx], data);
              }
              return Promise.resolve({ stats: { updated: idx !== -1 ? 1 : 0 } });
            }
          };
        },
where(condition) {
              const self = this;
              const filterFn = (docs) => {
                let results = [...docs];
                for (const [key, val] of Object.entries(condition)) {
                  if (typeof val === 'object' && val !== null) {
                    if (val.$in) {
                      results = results.filter(d => val.$in.includes(d[key]));
                    } else if (val.$lt !== undefined) {
                      results = results.filter(d => d[key] < val.$lt);
                    } else if (val.$gt !== undefined) {
                      results = results.filter(d => d[key] > val.$gt);
                    } else if (val.$eq !== undefined) {
                      results = results.filter(d => d[key] === val.$eq);
                    }
                  } else {
                    results = results.filter(d => d[key] === val);
                  }
                }
                return results;
              };
              return {
                get() {
                  return Promise.resolve({ data: filterFn(self._docs) });
                },
                count() {
                  return Promise.resolve({ total: filterFn(self._docs).length });
                },
                orderBy(field, direction) {
                  const filteredDocs = filterFn([...self._docs]);
                  return {
                    limit(n) {
                      return {
                        get() {
                          let results = [...filteredDocs];
                          results.sort((a, b) => {
                            if (direction === 'desc') return b[field] - a[field];
                            return a[field] - b[field];
                          });
                          return Promise.resolve({ data: results.slice(0, n) });
                        }
                      };
                    },
                    get() {
                      let results = [...filteredDocs];
                      results.sort((a, b) => {
                        if (direction === 'desc') return b[field] - a[field];
                        return a[field] - b[field];
                      });
                      return Promise.resolve({ data: results });
                    }
                  };
                }
              };
            }
      };
    }
    return this._collections[name];
  },
  _reset() {
    this._collections = {};
  }
};

const mockCloud = {
  _openid: 'mock-openid-123',
  _fileCounter: 0,
  getWXContext() {
    return { OPENID: this._openid };
  },
  database() {
    return mockDatabase;
  },
  uploadFile({ cloudPath }) {
    this._fileCounter++;
    return Promise.resolve({ fileID: `cloud://${cloudPath}` });
  },
  getTempFileURL({ fileList }) {
    return Promise.resolve({
      fileList: fileList.map(fileID => ({ fileID, tempFileURL: `https://tmp/${fileID}` }))
    });
  }
};

global.cloud = mockCloud;
global.mockDatabase = mockDatabase;

beforeEach(() => {
  mockDatabase._reset();
  mockCloud._fileCounter = 0;
});
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
coverage/
.env
.DS_Store
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

- [ ] **Step 7: Run tests to verify setup works**

```bash
npm test -- --passWithNoTests
```

Expected: Jest runs successfully with 0 tests (no test files yet)

- [ ] **Step 8: Commit**

```bash
git add package.json jest.config.js tests/setup.js .gitignore
git commit -m "chore: initialize project with jest and WeChat SDK mock"
```

---

### Task 2: login Cloud Function ✅ **DONE** `6385cb5`

**Files:**
- Create: `D:/vibe-project/tests/login.test.js`
- Create: `D:/vibe-project/cloudfunctions/login.js`

**Interfaces:**
- Produces: `exports.main = async (event, context) => { data: { user: { _id, openid, nickname, avatarUrl, createdAt } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/login.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/login.test.js
```

Expected: FAIL - `Cannot find module '../cloudfunctions/login'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/login.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const usersCollection = db.collection('users');

  const existing = await usersCollection.where({ openid }).get();

  if (existing.data.length > 0) {
    return { data: { user: existing.data[0] } };
  }

  const result = await usersCollection.add({
    data: {
      openid,
      nickname: '微信用户',
      avatarUrl: '',
      createdAt: Date.now()
    }
  });

  const newUser = { _id: result._id, openid, nickname: '微信用户', avatarUrl: '', createdAt: Date.now() };
  return { data: { user: newUser } };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/login.test.js
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/login.js tests/login.test.js
git commit -m "feat: implement login cloud function"
```

---

### Task 3: createSpace Cloud Function ✅ **DONE** `0033117`

**Files:**
- Create: `D:/vibe-project/tests/createSpace.test.js`
- Create: `D:/vibe-project/cloudfunctions/createSpace.js`

**Interfaces:**
- Produces: `exports.main = async (event, context) => { data: { space: { _id, name, creatorId, members, inviteCode, createdAt } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/createSpace.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/createSpace.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/createSpace.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

exports.main = async (event, context) => {
  const { name } = event;
  if (!name || name.trim() === '') {
    throw new Error('空间名称不能为空');
  }

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();
  const spacesCollection = db.collection('spaces');

  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = await spacesCollection.where({ inviteCode }).get();
    if (existing.data.length === 0) break;
    attempts++;
    if (attempts > 10) throw new Error('无法生成唯一邀请码，请重试');
  } while (true);

  const result = await spacesCollection.add({
    data: {
      name: name.trim(),
      creatorId: openid,
      members: [openid],
      inviteCode,
      createdAt: Date.now()
    }
  });

  return {
    data: {
      space: {
        _id: result._id,
        name: name.trim(),
        creatorId: openid,
        members: [openid],
        inviteCode,
        createdAt: Date.now()
      }
    }
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/createSpace.test.js
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/createSpace.js tests/createSpace.test.js
git commit -m "feat: implement createSpace cloud function"
```

---

### Task 4: joinSpace Cloud Function ✅ **DONE** `8e6f3a3`

**Files:**
- Create: `D:/vibe-project/tests/joinSpace.test.js`
- Create: `D:/vibe-project/cloudfunctions/joinSpace.js`

**Interfaces:**
- Consumes: `createSpace` (space in mock database with inviteCode)
- Produces: `exports.main = async (event, context) => { data: { space: { ... } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/joinSpace.test.js
const { main: joinSpace } = require('../cloudfunctions/joinSpace');
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/joinSpace.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/joinSpace.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { inviteCode } = event;
  if (!inviteCode) {
    throw new Error('邀请码无效');
  }

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();
  const spacesCollection = db.collection('spaces');

  const existing = await spacesCollection.where({ inviteCode }).get();
  if (existing.data.length === 0) {
    throw new Error('邀请码无效');
  }

  const space = existing.data[0];
  if (space.members.includes(openid)) {
    throw new Error('你已在该空间中');
  }

  const updatedMembers = [...space.members, openid];
  await spacesCollection.doc(space._id).update({
    data: { members: updatedMembers }
  });

  return {
    data: {
      space: { ...space, members: updatedMembers }
    }
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/joinSpace.test.js
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/joinSpace.js tests/joinSpace.test.js
git commit -m "feat: implement joinSpace cloud function"
```

---

### Task 5: uploadPhoto Cloud Function ✅ **DONE** `64e1297`

**Files:**
- Create: `D:/vibe-project/tests/uploadPhoto.test.js`
- Create: `D:/vibe-project/cloudfunctions/uploadPhoto.js`

**Interfaces:**
- Consumes: `createSpace` (space in mock database)
- Produces: `exports.main = async (event, context) => { data: { photo: { _id, spaceId, uploaderId, imageUrl, takenAt, locationName, caption, createdAt } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/uploadPhoto.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/uploadPhoto.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/uploadPhoto.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { spaceId, imageUrl, takenAt, locationName, latitude, longitude, caption } = event;

  if (!spaceId) throw new Error('空间ID不能为空');
  if (!takenAt) throw new Error('拍摄时间不能为空');

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const result = await db.collection('photos').add({
    data: {
      spaceId,
      uploaderId: openid,
      imageUrl,
      takenAt,
      locationName: locationName || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      caption: caption || undefined,
      createdAt: Date.now()
    }
  });

  return {
    data: {
      photo: {
        _id: result._id,
        spaceId,
        uploaderId: openid,
        imageUrl,
        takenAt,
        locationName,
        caption,
        createdAt: Date.now()
      }
    }
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/uploadPhoto.test.js
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/uploadPhoto.js tests/uploadPhoto.test.js
git commit -m "feat: implement uploadPhoto cloud function"
```

---

### Task 6: getPhotos Cloud Function ✅ **DONE** `8e9bc21`

**Files:**
- Create: `D:/vibe-project/tests/getPhotos.test.js`
- Create: `D:/vibe-project/cloudfunctions/getPhotos.js`

**Interfaces:**
- Consumes: `createSpace`, `uploadPhoto` (to populate test data)
- Produces: `exports.main = async (event, context) => { data: { photos: Array<photo>, hasMore: boolean } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/getPhotos.test.js
const { main: getPhotos } = require('../cloudfunctions/getPhotos');
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
      await uploadPhoto({ spaceId, imageUrl: `cloud://photo${i}.jpg`, takenAt: Date.now() + i }, {});
    }

    const result = await getPhotos({ spaceId, pageSize: 20 }, {});
    expect(result.data.photos.length).toBe(20);
    expect(result.data.hasMore).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/getPhotos.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/getPhotos.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { spaceId, pageSize = 20, lastCreatedAt } = event;

  const db = cloud.database();
  const collection = db.collection('photos');

  let query = collection.where({ spaceId }).orderBy('createdAt', 'desc');

  if (lastCreatedAt) {
    query = collection.where({ spaceId, createdAt: db.command.lt(lastCreatedAt) }).orderBy('createdAt', 'desc');
  }

  const limit = Math.min(pageSize, 20);
  const result = await query.limit(limit + 1).get();

  const hasMore = result.data.length > limit;
  const photos = result.data.slice(0, limit);

  return { data: { photos, hasMore } };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/getPhotos.test.js
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/getPhotos.js tests/getPhotos.test.js
git commit -m "feat: implement getPhotos cloud function"
```

---

### Task 7: createWish Cloud Function ✅ **DONE** `5bc3da0`

**Files:**
- Create: `D:/vibe-project/tests/createWish.test.js`
- Create: `D:/vibe-project/cloudfunctions/createWish.js`

**Interfaces:**
- Consumes: `createSpace` (space in mock database)
- Produces: `exports.main = async (event, context) => { data: { wish: { _id, spaceId, creatorId, title, type, done, createdAt } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/createWish.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/createWish.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/createWish.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const VALID_TYPES = ['food', 'travel', 'other'];

exports.main = async (event, context) => {
  const { spaceId, title, type, location, note } = event;

  if (!title || title.trim() === '') throw new Error('心愿标题不能为空');
  if (title.length > 100) throw new Error('心愿标题不能超过100字');
  if (!type) throw new Error('心愿类型不能为空');
  if (!VALID_TYPES.includes(type)) throw new Error('心愿类型无效');

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const result = await db.collection('wishes').add({
    data: {
      spaceId,
      creatorId: openid,
      title: title.trim(),
      type,
      location: location || undefined,
      note: note || undefined,
      done: false,
      createdAt: Date.now()
    }
  });

  return {
    data: {
      wish: {
        _id: result._id,
        spaceId,
        creatorId: openid,
        title: title.trim(),
        type,
        location,
        note,
        done: false,
        createdAt: Date.now()
      }
    }
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/createWish.test.js
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/createWish.js tests/createWish.test.js
git commit -m "feat: implement createWish cloud function"
```

---

### Task 8: getWishes Cloud Function ✅ **DONE** `57269e8`

**Files:**
- Create: `D:/vibe-project/tests/getWishes.test.js`
- Create: `D:/vibe-project/cloudfunctions/getWishes.js`

**Interfaces:**
- Consumes: `createSpace`, `createWish` (to populate test data)
- Produces: `exports.main = async (event, context) => { data: { wishes: Array<wish> } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/getWishes.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/getWishes.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/getWishes.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { spaceId, done } = event;

  const db = cloud.database();
  const condition = { spaceId };
  if (done !== undefined) {
    condition.done = done;
  }

  const result = await db.collection('wishes').where(condition).orderBy('createdAt', 'desc').get();

  return { data: { wishes: result.data } };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/getWishes.test.js
```

Expected: 3 tests PASS (note: completeWish needs to exist for test 3, but it's being imported in the test - we may need to adjust)

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/getWishes.js tests/getWishes.test.js
git commit -m "feat: implement getWishes cloud function"
```

---

### Task 9: completeWish Cloud Function ✅ **DONE** `b69d5d2`

**Files:**
- Create: `D:/vibe-project/tests/completeWish.test.js`
- Create: `D:/vibe-project/cloudfunctions/completeWish.js`

**Interfaces:**
- Consumes: `createSpace`, `createWish` (for wish to complete)
- Produces: `exports.main = async (event, context) => { data: { wish: { _id, done, doneAt, doneBy, linkedPhotoIds } } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/completeWish.test.js
const { main: completeWish } = require('../cloudfunctions/completeWish');
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/completeWish.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/completeWish.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { wishId, linkedPhotoIds } = event;

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const result = await db.collection('wishes').doc(wishId).get();

  if (result.data.length === 0) {
    throw new Error('心愿不存在');
  }

  const wish = result.data[0];
  if (wish.done) {
    throw new Error('心愿已完成');
  }

  const update = {
    done: true,
    doneAt: Date.now(),
    doneBy: openid,
    linkedPhotoIds: linkedPhotoIds || []
  };

  await db.collection('wishes').doc(wishId).update({ data: update });

  return {
    data: {
      wish: { ...wish, ...update }
    }
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/completeWish.test.js
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/completeWish.js tests/completeWish.test.js
git commit -m "feat: implement completeWish cloud function"
```

---

### Task 10: getStats Cloud Function ✅ **DONE** `c6b7558`

**Files:**
- Create: `D:/vibe-project/tests/getStats.test.js`
- Create: `D:/vibe-project/cloudfunctions/getStats.js`

**Interfaces:**
- Consumes: `createSpace`, `uploadPhoto`, `createWish` (to populate test data)
- Produces: `exports.main = async (event, context) => { data: { spaces: Array<{ _id, name, memberCount, photoCount, wishCount }> } }`

- [ ] **Step 1: Write failing test**

```javascript
// tests/getStats.test.js
const { main: getStats } = require('../cloudfunctions/getStats');
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/getStats.test.js
```

Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```javascript
// cloudfunctions/getStats.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();

  const spacesResult = await db.collection('spaces').get();
  const spaces = spacesResult.data;

  const stats = await Promise.all(spaces.map(async (space) => {
    const photoCount = await db.collection('photos').where({ spaceId: space._id }).count();
    const wishCount = await db.collection('wishes').where({ spaceId: space._id }).count();

    return {
      _id: space._id,
      name: space.name,
      memberCount: space.members ? space.members.length : 0,
      photoCount: photoCount.total,
      wishCount: wishCount.total
    };
  }));

  return { data: { spaces: stats } };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/getStats.test.js
```

Expected: 3 tests PASS

- [ ] **Step 5: Run all cloud function tests**

```bash
npx jest tests/
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add cloudfunctions/getStats.js tests/getStats.test.js
git commit -m "feat: implement getStats cloud function"
```

---

### Task 11: Mini-Program App Shell + Login Page ✅ **DONE** `de6754a`

**Files:**
- Create: `D:/vibe-project/miniprogram/app.js`
- Create: `D:/vibe-project/miniprogram/app.json`
- Create: `D:/vibe-project/miniprogram/app.wxss`
- Create: `D:/vibe-project/miniprogram/pages/index/index.js`
- Create: `D:/vibe-project/miniprogram/pages/index/index.json`
- Create: `D:/vibe-project/miniprogram/pages/index/index.wxml`
- Create: `D:/vibe-project/miniprogram/pages/index/index.wxss`
- Create: `D:/vibe-project/miniprogram/utils/util.js`

**Interfaces:**
- Consumes: (none - app shell is the entry point)
- Produces: `app.js` with global user state, cloud init; `index` page with login flow

- [ ] **Step 1: Create app.js**

```javascript
// miniprogram/app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'your-env-id',
      traceUser: true
    });
    this.globalData = {
      userInfo: null,
      openid: null
    };
  },

  async login() {
    const res = await wx.cloud.callFunction({ name: 'login' });
    this.globalData.userInfo = res.result.data.user;
    this.globalData.openid = res.result.data.user.openid;
    return res.result.data.user;
  }
});
```

- [ ] **Step 2: Create app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/space/space",
    "pages/photos/photos",
    "pages/photo-detail/photo-detail",
    "pages/upload/upload",
    "pages/wishes/wishes",
    "pages/wish-create/wish-create",
    "pages/wish-detail/wish-detail",
    "pages/space-settings/space-settings"
  ],
  "window": {
    "navigationBarTitleText": "共享心愿相册",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5"
  },
  "style": "v2",
  "sdkversion": "2.0.0"
}
```

- [ ] **Step 3: Create app.wxss**

```css
/* miniprogram/app.wxss */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  padding: 20rpx;
}

.btn-primary {
  background-color: #07c160;
  color: #fff;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 32rpx;
}

.btn-primary:active {
  background-color: #06ad56;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
  color: #999;
  font-size: 28rpx;
}
```

- [ ] **Step 4: Create utils/util.js**

```javascript
// miniprogram/utils/util.js
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return formatTime(date) + ' ' + date.toTimeString().slice(0, 5);
}

module.exports = { formatTime, formatDateTime };
```

- [ ] **Step 5: Create index page (login + space list)**

```javascript
// miniprogram/pages/index/index.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    spaces: [],
    loading: true
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadSpaces();
    }
  },

  async checkLogin() {
    try {
      const user = await app.login();
      this.setData({ isLoggedIn: true });
      this.loadSpaces();
    } catch (err) {
      this.setData({ isLoggedIn: false, loading: false });
    }
  },

  async handleLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      await app.login();
      this.setData({ isLoggedIn: true });
      this.loadSpaces();
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async loadSpaces() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const openid = app.globalData.openid;
      const res = await db.collection('spaces').where({
        members: db.command.in([openid])
      }).get();
      this.setData({ spaces: res.data, loading: false });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async handleCreateSpace() {
    const res = await wx.showModal({
      title: '新建空间',
      editable: true,
      placeholderText: '输入空间名称'
    });
    if (!res.confirm || !res.content) return;

    wx.showLoading({ title: '创建中...' });
    try {
      const result = await wx.cloud.callFunction({
        name: 'createSpace',
        data: { name: res.content }
      });
      wx.hideLoading();
      await wx.showModal({
        title: '创建成功',
        content: `邀请码：${result.result.data.space.inviteCode}\n分享给 TA 吧！`,
        showCancel: false
      });
      this.loadSpaces();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  },

  async handleJoinSpace() {
    const res = await wx.showModal({
      title: '加入空间',
      editable: true,
      placeholderText: '输入6位邀请码'
    });
    if (!res.confirm || !res.content) return;

    wx.showLoading({ title: '加入中...' });
    try {
      await wx.cloud.callFunction({
        name: 'joinSpace',
        data: { inviteCode: res.content.trim().toUpperCase() }
      });
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.loadSpaces();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败', icon: 'none' });
    }
  },

  handleOpenSpace(e) {
    const spaceId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/space/space?spaceId=${spaceId}` });
  }
});
```

- [ ] **Step 6: Create index.json**

```json
{
  "navigationBarTitleText": "我的空间"
}
```

- [ ] **Step 7: Create index.wxml**

```xml
<!-- miniprogram/pages/index/index.wxml -->
<view wx:if="{{!isLoggedIn}}" class="login-container">
  <view class="login-card">
    <view class="login-icon">📸</view>
    <view class="login-title">共享心愿相册</view>
    <view class="login-desc">记录你和 TA 的回忆与期待</view>
    <button class="btn-primary login-btn" bindtap="handleLogin">微信授权登录</button>
  </view>
</view>

<view wx:else class="container">
  <view class="header">
    <view class="header-title">我的空间</view>
    <view class="header-actions">
      <button class="btn-small" bindtap="handleCreateSpace">新建</button>
      <button class="btn-small btn-outline" bindtap="handleJoinSpace">加入</button>
    </view>
  </view>

  <view wx:if="{{loading}}" class="empty-state">加载中...</view>

  <view wx:elif="{{spaces.length === 0}}" class="empty-state">
    <view>还没有空间，创建一个吧</view>
  </view>

  <view wx:else class="space-list">
    <view wx:for="{{spaces}}" wx:key="_id" class="space-card" bindtap="handleOpenSpace" data-id="{{item._id}}">
      <view class="space-card-name">{{item.name}}</view>
      <view class="space-card-meta">{{item.members.length}} 位成员</view>
    </view>
  </view>
</view>
```

- [ ] **Step 8: Create index.wxss**

```css
/* miniprogram/pages/index/index.wxss */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 80rpx 60rpx;
  text-align: center;
  width: 600rpx;
}

.login-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.login-title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.login-desc {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 60rpx;
}

.login-btn {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.btn-small {
  font-size: 26rpx;
  padding: 12rpx 24rpx;
  background-color: #07c160;
  color: #fff;
  border-radius: 8rpx;
  border: none;
}

.btn-outline {
  background-color: transparent;
  color: #07c160;
  border: 2rpx solid #07c160;
}

.space-list {
  margin-top: 20rpx;
}

.space-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.space-card-name {
  font-size: 32rpx;
  font-weight: 500;
}

.space-card-meta {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
```

- [ ] **Step 9: Commit**

```bash
git add miniprogram/
git commit -m "feat: implement app shell and login/space list page"
```

---

### Task 12: Space Home Page (Tabs) ✅ **DONE** `cc91160`

**Files:**
- Create: `D:/vibe-project/miniprogram/pages/space/space.js`
- Create: `D:/vibe-project/miniprogram/pages/space/space.json`
- Create: `D:/vibe-project/miniprogram/pages/space/space.wxml`
- Create: `D:/vibe-project/miniprogram/pages/space/space.wxss`

**Interfaces:**
- Consumes: App global data, spaceId from query params
- Produces: Space home page with tab bar (photos tab, wishes tab)

- [ ] **Step 1: Create space.js**

```javascript
// miniprogram/pages/space/space.js
Page({
  data: {
    spaceId: '',
    spaceName: '',
    currentTab: 0,
    tabs: ['相册', '心愿']
  },

  onLoad(options) {
    const spaceId = options.spaceId;
    this.setData({ spaceId });
    this.loadSpaceInfo();
  },

  async loadSpaceInfo() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('spaces').doc(this.data.spaceId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ spaceName: res.data[0].name });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  goToPhotos() {
    wx.navigateTo({ url: `/pages/photos/photos?spaceId=${this.data.spaceId}` });
  },

  goToWishes() {
    wx.navigateTo({ url: `/pages/wishes/wishes?spaceId=${this.data.spaceId}` });
  },

  goToSettings() {
    wx.navigateTo({ url: `/pages/space-settings/space-settings?spaceId=${this.data.spaceId}` });
  }
});
```

- [ ] **Step 2: Create space.json**

```json
{
  "navigationBarTitleText": "空间详情"
}
```

- [ ] **Step 3: Create space.wxml**

```xml
<!-- miniprogram/pages/space/space.wxml -->
<view class="container">
  <view class="space-header">
    <view class="space-name">{{spaceName}}</view>
    <view class="space-actions">
      <text class="action-icon" bindtap="goToSettings">⚙</text>
    </view>
  </view>

  <view class="tab-bar">
    <view wx:for="{{tabs}}" wx:key="*this" class="tab-item {{currentTab === index ? 'active' : ''}}" bindtap="switchTab" data-index="{{index}}">
      {{item}}
    </view>
  </view>

  <view class="tab-content">
    <view wx:if="{{currentTab === 0}}" class="photo-entry" bindtap="goToPhotos">
      <view class="entry-icon">📷</view>
      <view class="entry-text">查看共享相册</view>
    </view>
    <view wx:else class="wish-entry" bindtap="goToWishes">
      <view class="entry-icon">⭐</view>
      <view class="entry-text">查看心愿列表</view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Create space.wxss**

```css
/* miniprogram/pages/space/space.wxss */
.space-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
}

.space-name {
  font-size: 36rpx;
  font-weight: bold;
}

.action-icon {
  font-size: 40rpx;
  padding: 10rpx;
}

.tab-bar {
  display: flex;
  margin: 20rpx 0;
  border-bottom: 2rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 30rpx;
  color: #999;
  border-bottom: 4rpx solid transparent;
}

.tab-item.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.tab-content {
  padding: 40rpx 0;
}

.photo-entry, .wish-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  background: #fff;
  border-radius: 16rpx;
}

.entry-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.entry-text {
  font-size: 28rpx;
  color: #666;
}
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/space/
git commit -m "feat: implement space home page with tabs"
```

---

### Task 13: Photo Pages (Stream, Detail, Upload) ✅ **DONE** `9be9bf3` `4f29f4c`

**Files:**
- Create: `D:/vibe-project/miniprogram/pages/photos/photos.js`
- Create: `D:/vibe-project/miniprogram/pages/photos/photos.json`
- Create: `D:/vibe-project/miniprogram/pages/photos/photos.wxml`
- Create: `D:/vibe-project/miniprogram/pages/photos/photos.wxss`
- Create: `D:/vibe-project/miniprogram/pages/photo-detail/photo-detail.js`
- Create: `D:/vibe-project/miniprogram/pages/photo-detail/photo-detail.json`
- Create: `D:/vibe-project/miniprogram/pages/photo-detail/photo-detail.wxml`
- Create: `D:/vibe-project/miniprogram/pages/photo-detail/photo-detail.wxss`
- Create: `D:/vibe-project/miniprogram/pages/upload/upload.js`
- Create: `D:/vibe-project/miniprogram/pages/upload/upload.json`
- Create: `D:/vibe-project/miniprogram/pages/upload/upload.wxml`
- Create: `D:/vibe-project/miniprogram/pages/upload/upload.wxss`

**Interfaces:**
- Consumes: App global data, spaceId from query params, cloud functions (uploadPhoto, getPhotos)

- [ ] **Step 1: Create photos page**

```javascript
// miniprogram/pages/photos/photos.js
const util = require('../../utils/util');

Page({
  data: {
    spaceId: '',
    photos: [],
    hasMore: true,
    pageSize: 20
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadPhotos();
  },

  onPullDownRefresh() {
    this.setData({ photos: [], hasMore: true });
    this.loadPhotos().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadPhotos();
    }
  },

  async loadPhotos() {
    wx.showNavigationBarLoading();
    try {
      const lastCreatedAt = this.data.photos.length > 0
        ? this.data.photos[this.data.photos.length - 1].createdAt
        : undefined;

      const res = await wx.cloud.callFunction({
        name: 'getPhotos',
        data: { spaceId: this.data.spaceId, pageSize: this.data.pageSize, lastCreatedAt }
      });

      const newPhotos = res.result.data.photos.map(p => ({
        ...p,
        takenAtFormatted: util.formatDateTime(p.takenAt)
      }));

      this.setData({
        photos: [...this.data.photos, ...newPhotos],
        hasMore: res.result.data.hasMore
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideNavigationBarLoading();
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/photo-detail/photo-detail?photoId=${id}` });
  },

  goToUpload() {
    wx.navigateTo({ url: `/pages/upload/upload?spaceId=${this.data.spaceId}` });
  }
});
```

- [ ] **Step 2: Create photos.json**

```json
{
  "navigationBarTitleText": "共享相册",
  "enablePullDownRefresh": true
}
```

- [ ] **Step 3: Create photos.wxml**

```xml
<!-- miniprogram/pages/photos/photos.wxml -->
<view class="container">
  <view wx:if="{{photos.length === 0}}" class="empty-state">
    <view>还没有照片，快来上传第一张吧</view>
  </view>

  <view wx:else class="photo-grid">
    <view wx:for="{{photos}}" wx:key="_id" class="photo-item" bindtap="goToDetail" data-id="{{item._id}}">
      <image class="photo-thumb" src="{{item.imageUrl}}" mode="aspectFill" lazy-load />
      <view class="photo-info">
        <view class="photo-location" wx:if="{{item.locationName}}">{{item.locationName}}</view>
        <view class="photo-date">{{item.takenAtFormatted}}</view>
      </view>
    </view>
  </view>

  <view wx:if="{{hasMore}}" class="load-more">加载更多...</view>
  <view wx:else class="load-more">没有更多了</view>

  <view class="upload-fab" bindtap="goToUpload">
    <text class="fab-icon">+</text>
  </view>
</view>
```

- [ ] **Step 4: Create photos.wxss**

```css
/* miniprogram/pages/photos/photos.wxss */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 12rpx 0;
}

.photo-item {
  width: calc(50% - 6rpx);
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
}

.photo-thumb {
  width: 100%;
  height: 300rpx;
}

.photo-info {
  padding: 16rpx;
}

.photo-location {
  font-size: 26rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.photo-date {
  font-size: 22rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 26rpx;
}

.upload-fab {
  position: fixed;
  bottom: 60rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.4);
}

.fab-icon {
  font-size: 50rpx;
  color: #fff;
  line-height: 1;
}
```

- [ ] **Step 5: Create photo-detail page**

```javascript
// miniprogram/pages/photo-detail/photo-detail.js
const util = require('../../utils/util');

Page({
  data: {
    photo: null
  },

  onLoad(options) {
    const photoId = options.photoId;
    this.loadPhoto(photoId);
  },

  async loadPhoto(photoId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const db = wx.cloud.database();
      const res = await db.collection('photos').doc(photoId).get();
      if (res.data && res.data.length > 0) {
        const photo = res.data[0];
        photo.takenAtFormatted = util.formatDateTime(photo.takenAt);
        this.setData({ photo });
      } else {
        wx.showToast({ title: '照片已失效', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.photo.imageUrl],
      current: this.data.photo.imageUrl
    });
  }
});
```

- [ ] **Step 6: Create photo-detail.json**

```json
{
  "navigationBarTitleText": "照片详情"
}
```

- [ ] **Step 7: Create photo-detail.wxml**

```xml
<!-- miniprogram/pages/photo-detail/photo-detail.wxml -->
<view wx:if="{{photo}}" class="container">
  <image class="detail-image" src="{{photo.imageUrl}}" mode="widthFix" bindtap="previewImage" />
  <view class="detail-info">
    <view class="detail-row" wx:if="{{photo.locationName}}">
      <text class="detail-label">地点</text>
      <text class="detail-value">{{photo.locationName}}</text>
    </view>
    <view class="detail-row">
      <text class="detail-label">时间</text>
      <text class="detail-value">{{photo.takenAtFormatted}}</text>
    </view>
    <view class="detail-row" wx:if="{{photo.caption}}">
      <text class="detail-label">感受</text>
      <text class="detail-value">{{photo.caption}}</text>
    </view>
  </view>
</view>
```

- [ ] **Step 8: Create photo-detail.wxss**

```css
/* miniprogram/pages/photo-detail/photo-detail.wxss */
.detail-image {
  width: 100%;
  border-radius: 12rpx;
}

.detail-info {
  background: #fff;
  margin-top: 20rpx;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
}

.detail-row {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 100rpx;
  color: #999;
  font-size: 28rpx;
}

.detail-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
```

- [ ] **Step 9: Create upload page**

```javascript
// miniprogram/pages/upload/upload.js
Page({
  data: {
    spaceId: '',
    imagePath: '',
    takenAt: '',
    locationName: '',
    caption: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ imagePath: res.tempFilePaths[0] });
      }
    });
  },

  onDateChange(e) {
    this.setData({ takenAt: e.detail.value });
  },

  async submit() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请选择照片', icon: 'none' });
      return;
    }
    if (!this.data.takenAt) {
      wx.showToast({ title: '请选择拍摄时间', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '上传中...' });

    try {
      const cloudPath = `spaces/${this.data.spaceId}/photos/${Date.now()}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.imagePath
      });

      await wx.cloud.callFunction({
        name: 'uploadPhoto',
        data: {
          spaceId: this.data.spaceId,
          fileName: cloudPath,
          imageUrl: uploadRes.fileID,
          takenAt: new Date(this.data.takenAt).getTime(),
          locationName: this.data.locationName || undefined,
          caption: this.data.caption || undefined
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
```

- [ ] **Step 10: Create upload.json**

```json
{
  "navigationBarTitleText": "上传照片"
}
```

- [ ] **Step 11: Create upload.wxml**

```xml
<!-- miniprogram/pages/upload/upload.wxml -->
<view class="container">
  <view class="image-picker" bindtap="chooseImage">
    <image wx:if="{{imagePath}}" class="preview-image" src="{{imagePath}}" mode="aspectFill" />
    <view wx:else class="picker-placeholder">
      <text class="picker-icon">+</text>
      <text>点击选择照片</text>
    </view>
  </view>

  <view class="form-group">
    <view class="form-label">拍摄时间</view>
    <picker mode="date" value="{{takenAt}}" bindchange="onDateChange">
      <view class="form-picker">{{takenAt || '请选择'}}</view>
    </picker>
  </view>

  <view class="form-group">
    <view class="form-label">地点</view>
    <input class="form-input" placeholder="如：南京夫子庙" value="{{locationName}}" bindinput="onLocationInput" data-field="locationName" />
  </view>

  <view class="form-group">
    <view class="form-label">感受</view>
    <textarea class="form-textarea" placeholder="记录此刻的感受..." value="{{caption}}" bindinput="onLocationInput" data-field="caption" />
  </view>

  <button class="btn-primary submit-btn" bindtap="submit" disabled="{{submitting}}">
    {{submitting ? '上传中...' : '提交'}}
  </button>
</view>
```

- [ ] **Step 12: Create upload.wxss**

```css
/* miniprogram/pages/upload/upload.wxss */
.image-picker {
  width: 100%;
  height: 400rpx;
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #ddd;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.picker-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
  font-size: 28rpx;
}

.picker-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-picker {
  padding: 20rpx;
  background: #fff;
  border-radius: 8rpx;
  color: #333;
}

.form-input {
  padding: 20rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.form-textarea {
  padding: 20rpx;
  background: #fff;
  border-radius: 8rpx;
  height: 200rpx;
  font-size: 28rpx;
}

.submit-btn {
  width: 100%;
  margin-top: 40rpx;
}
```

- [ ] **Step 13: Commit**

```bash
git add miniprogram/pages/photos/ miniprogram/pages/photo-detail/ miniprogram/pages/upload/
git commit -m "feat: implement photo pages (stream, detail, upload)"
```

---

### Task 14: Wish Pages (List, Create, Detail) ✅ **DONE** `4f29f4c`

**Files:**
- Create: `D:/vibe-project/miniprogram/pages/wishes/wishes.js`
- Create: `D:/vibe-project/miniprogram/pages/wishes/wishes.json`
- Create: `D:/vibe-project/miniprogram/pages/wishes/wishes.wxml`
- Create: `D:/vibe-project/miniprogram/pages/wishes/wishes.wxss`
- Create: `D:/vibe-project/miniprogram/pages/wish-create/wish-create.js`
- Create: `D:/vibe-project/miniprogram/pages/wish-create/wish-create.json`
- Create: `D:/vibe-project/miniprogram/pages/wish-create/wish-create.wxml`
- Create: `D:/vibe-project/miniprogram/pages/wish-create/wish-create.wxss`
- Create: `D:/vibe-project/miniprogram/pages/wish-detail/wish-detail.js`
- Create: `D:/vibe-project/miniprogram/pages/wish-detail/wish-detail.json`
- Create: `D:/vibe-project/miniprogram/pages/wish-detail/wish-detail.wxml`
- Create: `D:/vibe-project/miniprogram/pages/wish-detail/wish-detail.wxss`

- [ ] **Step 1: Create wishes page**

```javascript
// miniprogram/pages/wishes/wishes.js
Page({
  data: {
    spaceId: '',
    activeFilter: 'all',
    filters: ['全部', '进行中', '已完成'],
    wishes: [],
    showDone: undefined
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadWishes();
  },

  onShow() {
    this.loadWishes();
  },

  async loadWishes() {
    try {
      const data = { spaceId: this.data.spaceId };
      if (this.data.showDone !== undefined) {
        data.done = this.data.showDone;
      }
      const res = await wx.cloud.callFunction({ name: 'getWishes', data });
      this.setData({ wishes: res.result.data.wishes });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  switchFilter(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeFilter: ['all', 'active', 'done'][index] });
    if (index === 0) this.setData({ showDone: undefined });
    else if (index === 1) this.setData({ showDone: false });
    else this.setData({ showDone: true });
    this.loadWishes();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/wish-detail/wish-detail?wishId=${id}` });
  },

  goToCreate() {
    wx.navigateTo({ url: `/pages/wish-create/wish-create?spaceId=${this.data.spaceId}` });
  }
});
```

- [ ] **Step 2: Create wishes.json**

```json
{
  "navigationBarTitleText": "心愿列表"
}
```

- [ ] **Step 3: Create wishes.wxml**

```xml
<!-- miniprogram/pages/wishes/wishes.wxml -->
<view class="container">
  <view class="filter-bar">
    <view wx:for="{{filters}}" wx:key="*this" class="filter-item {{activeFilter === item ? 'active' : ''}}" bindtap="switchFilter" data-index="{{index}}">
      {{item}}
    </view>
  </view>

  <view wx:if="{{wishes.length === 0}}" class="empty-state">
    <view>还没有心愿，快去创建吧</view>
  </view>

  <view wx:else class="wish-list">
    <view wx:for="{{wishes}}" wx:key="_id" class="wish-card" bindtap="goToDetail" data-id="{{item._id}}">
      <view class="wish-card-header">
        <view class="wish-type-tag {{item.type}}">
          {{item.type === 'food' ? '美食' : item.type === 'travel' ? '旅游' : '其他'}}
        </view>
        <view class="wish-done-tag {{item.done ? 'completed' : ''}}">
          {{item.done ? '已完成' : '进行中'}}
        </view>
      </view>
      <view class="wish-title">{{item.title}}</view>
      <view class="wish-location" wx:if="{{item.location}}">{{item.location}}</view>
    </view>
  </view>

  <view class="create-fab" bindtap="goToCreate">
    <text class="fab-icon">+</text>
  </view>
</view>
```

- [ ] **Step 4: Create wishes.wxss**

```css
/* miniprogram/pages/wishes/wishes.wxss */
.filter-bar {
  display: flex;
  margin-bottom: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-bottom: 4rpx solid transparent;
}

.filter-item.active {
  color: #07c160;
  border-bottom-color: #07c160;
}

.wish-list {
  margin-top: 10rpx;
}

.wish-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

.wish-card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.wish-type-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  color: #fff;
}

.wish-type-tag.food { background: #ff6b6b; }
.wish-type-tag.travel { background: #4ecdc4; }
.wish-type-tag.other { background: #95a5a6; }

.wish-done-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  background: #e8f5e9;
  color: #07c160;
}

.wish-done-tag.completed {
  background: #f5f5f5;
  color: #999;
}

.wish-title {
  font-size: 30rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.wish-location {
  font-size: 24rpx;
  color: #999;
}

.create-fab {
  position: fixed;
  bottom: 60rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.4);
}

.fab-icon {
  font-size: 50rpx;
  color: #fff;
  line-height: 1;
}
```

- [ ] **Step 5: Create wish-create page**

```javascript
// miniprogram/pages/wish-create/wish-create.js
Page({
  data: {
    spaceId: '',
    title: '',
    type: 'food',
    types: [
      { value: 'food', label: '美食' },
      { value: 'travel', label: '旅游' },
      { value: 'other', label: '其他' }
    ],
    location: '',
    note: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
  },

  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  async submit() {
    const { title, type, location, note } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入心愿标题', icon: 'none' });
      return;
    }
    if (title.length > 100) {
      wx.showToast({ title: '标题不能超过100字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await wx.cloud.callFunction({
        name: 'createWish',
        data: { spaceId: this.data.spaceId, title: title.trim(), type, location: location || undefined, note: note || undefined }
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
```

- [ ] **Step 6: Create wish-create.json**

```json
{
  "navigationBarTitleText": "新建心愿"
}
```

- [ ] **Step 7: Create wish-create.wxml**

```xml
<!-- miniprogram/pages/wish-create/wish-create.wxml -->
<view class="container">
  <view class="form-group">
    <view class="form-label">心愿标题</view>
    <input class="form-input" placeholder="如：去日本看樱花" maxlength="100" value="{{title}}" bindinput="onInput" data-field="title" />
    <view class="char-count">{{title.length}}/100</view>
  </view>

  <view class="form-group">
    <view class="form-label">类型</view>
    <radio-group bindchange="onTypeChange">
      <label wx:for="{{types}}" wx:key="value" class="radio-item">
        <radio value="{{item.value}}" checked="{{type === item.value}}" />
        <text>{{item.label}}</text>
      </label>
    </radio-group>
  </view>

  <view class="form-group">
    <view class="form-label">地点（可选）</view>
    <input class="form-input" placeholder="如：日本东京" value="{{location}}" bindinput="onInput" data-field="location" />
  </view>

  <view class="form-group">
    <view class="form-label">备注（可选）</view>
    <textarea class="form-textarea" placeholder="添加一些备注..." value="{{note}}" bindinput="onInput" data-field="note" />
  </view>

  <button class="btn-primary submit-btn" bindtap="submit" disabled="{{submitting}}">
    {{submitting ? '创建中...' : '创建心愿'}}
  </button>
</view>
```

- [ ] **Step 8: Create wish-create.wxss**

```css
/* miniprogram/pages/wish-create/wish-create.wxss */
.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  padding: 20rpx;
  background: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.char-count {
  text-align: right;
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.radio-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  font-size: 28rpx;
}

.form-textarea {
  padding: 20rpx;
  background: #fff;
  border-radius: 8rpx;
  height: 200rpx;
  font-size: 28rpx;
}

.submit-btn {
  width: 100%;
  margin-top: 40rpx;
}
```

- [ ] **Step 9: Create wish-detail page**

```javascript
// miniprogram/pages/wish-detail/wish-detail.js
Page({
  data: {
    wish: null,
    wishId: '',
    typeLabels: { food: '美食', travel: '旅游', other: '其他' }
  },

  onLoad(options) {
    this.setData({ wishId: options.wishId });
    this.loadWish();
  },

  onShow() {
    if (this.data.wishId) {
      this.loadWish();
    }
  },

  async loadWish() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('wishes').doc(this.data.wishId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ wish: res.data[0] });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async completeWish() {
    wx.showModal({
      title: '确认完成',
      content: '确定要标记这个心愿为已完成吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await wx.cloud.callFunction({
            name: 'completeWish',
            data: { wishId: this.data.wishId }
          });
          wx.showToast({ title: '心愿已完成！', icon: 'success' });
          this.loadWish();
        } catch (err) {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
      }
    });
  }
});
```

- [ ] **Step 10: Create wish-detail.json**

```json
{
  "navigationBarTitleText": "心愿详情"
}
```

- [ ] **Step 11: Create wish-detail.wxml**

```xml
<!-- miniprogram/pages/wish-detail/wish-detail.wxml -->
<view wx:if="{{wish}}" class="container">
  <view class="wish-header">
    <view class="wish-type-tag {{wish.type}}">{{typeLabels[wish.type]}}</view>
    <view class="wish-status {{wish.done ? 'completed' : ''}}">
      {{wish.done ? '已完成' : '进行中'}}
    </view>
  </view>

  <view class="wish-title">{{wish.title}}</view>

  <view class="wish-info" wx:if="{{wish.location || wish.note}}">
    <view class="info-row" wx:if="{{wish.location}}">
      <text class="info-label">地点</text>
      <text class="info-value">{{wish.location}}</text>
    </view>
    <view class="info-row" wx:if="{{wish.note}}">
      <text class="info-label">备注</text>
      <text class="info-value">{{wish.note}}</text>
    </view>
  </view>

  <view wx:if="{{wish.done}}" class="completed-info">
    <view class="info-row">
      <text class="info-label">完成时间</text>
      <text class="info-value">{{wish.doneAt}}</text>
    </view>
  </view>

  <view wx:if="{{!wish.done}}" class="complete-section">
    <button class="btn-primary complete-btn" bindtap="completeWish">标记完成</button>
  </view>
</view>
```

- [ ] **Step 12: Create wish-detail.wxss**

```css
/* miniprogram/pages/wish-detail/wish-detail.wxss */
.wish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.wish-type-tag {
  font-size: 24rpx;
  padding: 6rpx 20rpx;
  border-radius: 6rpx;
  color: #fff;
}

.wish-type-tag.food { background: #ff6b6b; }
.wish-type-tag.travel { background: #4ecdc4; }
.wish-type-tag.other { background: #95a5a6; }

.wish-status {
  font-size: 24rpx;
  padding: 6rpx 20rpx;
  border-radius: 6rpx;
  background: #e8f5e9;
  color: #07c160;
}

.wish-status.completed {
  background: #f5f5f5;
  color: #999;
}

.wish-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}

.wish-info, .completed-info {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  width: 120rpx;
  color: #999;
  font-size: 28rpx;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.complete-section {
  margin-top: 60rpx;
}

.complete-btn {
  width: 100%;
}
```

- [ ] **Step 13: Commit**

```bash
git add miniprogram/pages/wishes/ miniprogram/pages/wish-create/ miniprogram/pages/wish-detail/
git commit -m "feat: implement wish pages (list, create, detail)"
```

---

### Task 15: Space Settings Page ✅ **DONE** `b3d1ce3`

**Files:**
- Create: `D:/vibe-project/miniprogram/pages/space-settings/space-settings.js`
- Create: `D:/vibe-project/miniprogram/pages/space-settings/space-settings.json`
- Create: `D:/vibe-project/miniprogram/pages/space-settings/space-settings.wxml`
- Create: `D:/vibe-project/miniprogram/pages/space-settings/space-settings.wxss`

- [ ] **Step 1: Create space-settings page**

```javascript
// miniprogram/pages/space-settings/space-settings.js
Page({
  data: {
    spaceId: '',
    space: null,
    inviteCode: ''
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadSpaceInfo();
  },

  async loadSpaceInfo() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('spaces').doc(this.data.spaceId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ space: res.data[0], inviteCode: res.data[0].inviteCode });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' });
      }
    });
  }
});
```

- [ ] **Step 2: Create space-settings.json**

```json
{
  "navigationBarTitleText": "空间管理"
}
```

- [ ] **Step 3: Create space-settings.wxml**

```xml
<!-- miniprogram/pages/space-settings/space-settings.wxml -->
<view class="container" wx:if="{{space}}">
  <view class="section">
    <view class="section-title">空间信息</view>
    <view class="info-card">
      <view class="info-row">
        <text class="info-label">名称</text>
        <text class="info-value">{{space.name}}</text>
      </view>
      <view class="info-row">
        <text class="info-label">成员</text>
        <text class="info-value">{{space.members.length}} 人</text>
      </view>
    </view>
  </view>

  <view class="section">
    <view class="section-title">邀请成员</view>
    <view class="invite-card">
      <view class="invite-code">{{inviteCode}}</view>
      <view class="invite-hint">将邀请码发给 TA，TA 在首页点击「加入」输入即可</view>
      <button class="btn-primary" bindtap="copyInviteCode">复制邀请码</button>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Create space-settings.wxss**

```css
/* miniprogram/pages/space-settings/space-settings.wxss */
.section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 16rpx;
  padding-left: 10rpx;
}

.info-card, .invite-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
}

.invite-card {
  text-align: center;
}

.invite-code {
  font-size: 48rpx;
  font-weight: bold;
  letter-spacing: 8rpx;
  color: #07c160;
  margin: 20rpx 0;
}

.invite-hint {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 30rpx;
}
```

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/space-settings/
git commit -m "feat: implement space settings page"
```

---

### Task 16: Web Admin Dashboard ✅ **DONE** `f7099fe`

**Files:**
- Create: `D:/vibe-project/web-admin/index.html`

- [ ] **Step 1: Create web-admin/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>共享心愿相册 - 管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { color: #999; font-size: 14px; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .stat-card-name { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
    .stat-row span:last-child { font-weight: 500; color: #333; }
    .loading { text-align: center; padding: 60px; color: #999; }
    .error { text-align: center; padding: 60px; color: #e74c3c; }
    .empty { text-align: center; padding: 60px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>共享心愿相册</h1>
      <p>管理后台 - 空间统计概览</p>
    </div>
    <div id="stats" class="loading">加载中...</div>
  </div>

  <script>
    async function loadStats() {
      const container = document.getElementById('stats');
      try {
        container.innerHTML = '<div class="loading">加载中...</div>';

        const response = await fetch('/api/stats');
        const data = await response.json();

        if (!data.spaces || data.spaces.length === 0) {
          container.innerHTML = '<div class="empty">暂无空间数据</div>';
          return;
        }

        container.innerHTML = data.spaces.map(space => `
          <div class="stat-card">
            <div class="stat-card-name">${escapeHtml(space.name)}</div>
            <div class="stat-row"><span>成员</span><span>${space.memberCount} 人</span></div>
            <div class="stat-row"><span>照片</span><span>${space.photoCount} 张</span></div>
            <div class="stat-row"><span>心愿</span><span>${space.wishCount} 个</span></div>
          </div>
        `).join('');

        const wrapper = document.createElement('div');
        wrapper.className = 'stat-grid';
        wrapper.innerHTML = container.innerHTML;
        container.innerHTML = '';
        container.appendChild(wrapper);
        container.className = 'stat-grid';
      } catch (err) {
        container.innerHTML = '<div class="error">加载失败，请检查服务是否运行</div>';
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    loadStats();
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add web-admin/
git commit -m "feat: implement web admin dashboard"
```

---

### Task 17: CI Configuration + README ✅ **DONE** `c097667`

**Files:**
- Modify: `D:/vibe-project/.gitlab-ci.yml`
- Create: `D:/vibe-project/README.md`

- [ ] **Step 1: Write .gitlab-ci.yml**

```yaml
stages:
  - test

unit-test:
  stage: test
  image: node:18
  script:
    - npm install
    - npm test
  cache:
    paths:
      - node_modules/
```

- [ ] **Step 2: Write README.md**

```markdown
# 共享心愿相册 (Shared Wish Album)

一个微信小程序，供亲密关系（情侣、朋友、家人）之间共享照片和心愿记录。

**30 秒说明**：你和 TA 的专属相册 + 心愿清单，记录去过的地方，写下想去的地方，一起完成彼此的愿望。

## 功能

- 创建共享空间，邀请他人加入
- 上传照片，附带时间、地点、感受
- 记录心愿（美食/旅游/其他），标记完成
- 多空间管理，与不同的人共享

## 技术栈

- 微信小程序（原生）
- 微信云开发（云数据库、云存储、云函数）
- Node.js 云函数
- Jest 测试
- Vercel 静态托管（Web 管理后台）

## 目录结构

```
├── SPEC.md             # 设计文档
├── PLAN.md             # 实现计划
├── README.md           # 本文件
├── cloudfunctions/     # 云函数（Node.js）
├── miniprogram/        # 小程序前端代码
├── web-admin/          # Web 管理后台
├── tests/              # 云函数单元测试
└── .gitlab-ci.yml      # CI 配置
```

## 本地开发

### 前端（小程序）

1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 在 `app.js` 中配置云开发环境 ID
4. 编译运行

### 云函数测试

```bash
npm install
npm test
```

### Web 管理后台

```bash
cd web-admin
npx serve .
```

## 分发

### 小程序

通过微信审核后发布，用户扫码或搜索即可使用。

### Web 管理后台

部署到 Vercel：

```bash
cd web-admin
vercel --prod
```

## 凭据与安全

本项目不涉及 LLM API Key 或第三方付费 API。用户授权通过微信 OAuth 完成，openid 由云函数安全获取。云数据库使用安全规则控制数据访问权限。

## 已知限制

- 需在微信开发者工具中运行小程序
- 云开发环境需在微信公众平台配置
- 当前版本不含 AI 功能
- 图片上传限制 10MB

## License

MIT
```

- [ ] **Step 3: Commit**

```bash
git add .gitlab-ci.yml README.md
git commit -m "chore: add CI config and README"
```

---

## Dependency Graph

```
Task 1 (scaffolding)
  └─► Task 2 (login)
  └─► Task 3 (createSpace)
       └─► Task 4 (joinSpace)
       └─► Task 5 (uploadPhoto)
            └─► Task 6 (getPhotos)
       └─► Task 7 (createWish)
            └─► Task 8 (getWishes)
            └─► Task 9 (completeWish)
       └─► Task 10 (getStats)
  └─► Task 11 (app shell + login page)
       └─► Task 12 (space home page)
            └─► Task 13 (photo pages)
            └─► Task 14 (wish pages)
            └─► Task 15 (space settings)
  └─► Task 16 (web admin)
  └─► Task 17 (CI + README)
```

**Parallel groups:**
- Tasks 2-10 (cloud functions) can be developed in parallel after Task 1
- Tasks 11-15 (mini-program pages) can be developed in parallel after Task 1
- Task 16 (web admin) is independent
- Task 17 (CI + README) should be done last