// miniprogram/pages/photo-detail/photo-detail.js
const util = require('../../utils/util');

Page({
  data: {
    photo: null
  },

  onLoad(options) {
    const photoId = options.photoId;
    this.loadPhoto(photoId);
  },

  async loadPhoto(photoId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const db = wx.cloud.database();
      const res = await db.collection('photos').doc(photoId).get();
      if (res.data) {
        const photo = res.data;
        photo.takenAtFormatted = util.formatDateTime(photo.takenAt);
        this.setData({ photo });
      } else {
        wx.showToast({ title: '照片已失效', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.photo.imageUrl],
      current: this.data.photo.imageUrl
    });
  }
});