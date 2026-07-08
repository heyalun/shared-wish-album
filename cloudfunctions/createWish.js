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