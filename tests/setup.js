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
  DYNAMIC_CURRENT_ENV: 'mock-env',
  init() {},
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

global.beforeEach(() => {
  mockDatabase._reset();
  mockCloud._fileCounter = 0;
});