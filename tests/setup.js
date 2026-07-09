const { mockCloud, mockDatabase } = require('wx-server-sdk');

global.cloud = mockCloud;
global.mockDatabase = mockDatabase;

beforeEach(() => {
  mockDatabase._reset();
  mockCloud._openid = 'mock-openid-123';
  mockCloud._fileCounter = 0;
});