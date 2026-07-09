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