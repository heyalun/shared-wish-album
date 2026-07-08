const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { spaceId, title, type } = event;
  const db = cloud.database();
  const result = await db.collection('wishes').add({
    data: { spaceId, title, type, done: false, createdAt: Date.now() }
  });
  return { data: { wish: { _id: result._id, spaceId, title, type, done: false } } };
};