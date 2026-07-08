const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { inviteCode } = event;
  if (!inviteCode) {
    throw new Error('邀请码无效');
  }

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();
  const spacesCollection = db.collection('spaces');

  const existing = await spacesCollection.where({ inviteCode }).get();
  if (existing.data.length === 0) {
    throw new Error('邀请码无效');
  }

  const space = existing.data[0];
  if (space.members.includes(openid)) {
    throw new Error('你已在该空间中');
  }

  const updatedMembers = [...space.members, openid];
  await spacesCollection.doc(space._id).update({
    data: { members: updatedMembers }
  });

  return {
    data: {
      space: { ...space, members: updatedMembers }
    }
  };
};