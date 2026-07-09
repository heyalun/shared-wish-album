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
      createdAt: takenAt
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
        createdAt: takenAt
      }
    }
  };
};