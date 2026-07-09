const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { spaceId } = event;

  if (!spaceId) throw new Error('空间ID不能为空');

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  const spaceRes = await db.collection('spaces').doc(spaceId).get();
  if (!spaceRes.data) throw new Error('空间不存在');

  const space = spaceRes.data;
  if (space.creatorId !== openid) throw new Error('只有创建者可以删除空间');

  const photos = await db.collection('photos').where({ spaceId }).get();
  for (const photo of photos.data) {
    await cloud.deleteFile({ fileList: [photo.imageUrl] }).catch(() => {});
  }

  await db.collection('photos').where({ spaceId }).remove();
  await db.collection('wishes').where({ spaceId }).remove();
  await db.collection('spaces').doc(spaceId).remove();

  return { data: { success: true } };
};