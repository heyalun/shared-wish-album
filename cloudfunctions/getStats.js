const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();

  const spacesResult = await db.collection('spaces').get();
  const spaces = spacesResult.data;

  const stats = await Promise.all(spaces.map(async (space) => {
    const photoCount = await db.collection('photos').where({ spaceId: space._id }).count();
    const wishCount = await db.collection('wishes').where({ spaceId: space._id }).count();

    return {
      _id: space._id,
      name: space.name,
      memberCount: space.members ? space.members.length : 0,
      photoCount: photoCount.total,
      wishCount: wishCount.total
    };
  }));

  return { data: { spaces: stats } };
};