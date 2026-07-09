const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { wishId, linkedPhotoIds } = event;

  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const db = cloud.database();
  const result = await db.collection('wishes').doc(wishId).get();

  if (!result.data) {
    throw new Error('心愿不存在');
  }

  const wish = result.data;
  if (wish.done) {
    throw new Error('心愿已完成');
  }

  const update = {
    done: true,
    doneAt: Date.now(),
    doneBy: openid,
    linkedPhotoIds: linkedPhotoIds || []
  };

  await db.collection('wishes').doc(wishId).update({ data: update });

  return {
    data: {
      wish: { ...wish, ...update }
    }
  };
};