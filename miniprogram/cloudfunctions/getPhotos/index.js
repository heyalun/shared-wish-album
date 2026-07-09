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