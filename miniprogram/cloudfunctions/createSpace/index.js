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