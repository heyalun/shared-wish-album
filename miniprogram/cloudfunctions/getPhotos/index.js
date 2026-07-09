const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function convertUrls(photos) {
  if (!photos || photos.length === 0) return photos;
  try {
    const fileList = photos.map(p => p.imageUrl);
    const tempRes = await cloud.getTempFileURL({ fileList });
    const urlMap = {};
    tempRes.fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL; });
    return photos.map(p => ({ ...p, imageUrl: urlMap[p.imageUrl] || p.imageUrl }));
  } catch (e) {
    return photos;
  }
}

exports.main = async (event, context) => {
  const { spaceId, photoId, pageSize = 20, lastCreatedAt } = event;

  const db = cloud.database();
  const collection = db.collection('photos');

  if (photoId) {
    const result = await collection.doc(photoId).get();
    if (!result.data) return { data: { photo: null } };
    const [photo] = await convertUrls([result.data]);
    return { data: { photo: photo || result.data } };
  }

  let query = collection.where({ spaceId }).orderBy('createdAt', 'desc');

  if (lastCreatedAt) {
    query = collection.where({ spaceId, createdAt: db.command.lt(lastCreatedAt) }).orderBy('createdAt', 'desc');
  }

  const limit = Math.min(pageSize, 20);
  const result = await query.limit(limit + 1).get();

  const hasMore = result.data.length > limit;
  const photos = await convertUrls(result.data.slice(0, limit));

  return { data: { photos, hasMore } };
};