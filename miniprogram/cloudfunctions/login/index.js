const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const usersCollection = db.collection('users');

  const existing = await usersCollection.where({ openid }).get();

  if (existing.data.length > 0) {
    return { data: { user: existing.data[0] } };
  }

  const result = await usersCollection.add({
    data: {
      openid,
      nickname: '微信用户',
      avatarUrl: '',
      createdAt: Date.now()
    }
  });

  const newUser = { _id: result._id, openid, nickname: '微信用户', avatarUrl: '', createdAt: Date.now() };
  return { data: { user: newUser } };
};