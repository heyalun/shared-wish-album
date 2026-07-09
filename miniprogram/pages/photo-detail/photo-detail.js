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
      const res = await wx.cloud.callFunction({
        name: 'getPhotos',
        data: { photoId }
      });
      if (res.result.data.photo) {
        const photo = res.result.data.photo;
        photo.takenAtFormatted = util.formatDateTime(photo.takenAt);
        if (photo.imageUrl && photo.imageUrl.startsWith('cloud://')) {
          try {
            const tempRes = await wx.cloud.getTempFileURL({ fileList: [photo.imageUrl] });
            photo.imageUrl = tempRes.fileList[0].tempFileURL;
          } catch (e) {}
        }
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