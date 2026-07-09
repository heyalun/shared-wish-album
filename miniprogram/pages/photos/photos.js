// miniprogram/pages/photos/photos.js
const util = require('../../utils/util');

Page({
  data: {
    spaceId: '',
    photos: [],
    hasMore: true,
    pageSize: 20
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadPhotos();
  },

  onPullDownRefresh() {
    this.setData({ photos: [], hasMore: true });
    this.loadPhotos().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.loadPhotos();
    }
  },

  async loadPhotos() {
    wx.showNavigationBarLoading();
    try {
      const lastCreatedAt = this.data.photos.length > 0
        ? this.data.photos[this.data.photos.length - 1].createdAt
        : undefined;

      const res = await wx.cloud.callFunction({
        name: 'getPhotos',
        data: { spaceId: this.data.spaceId, pageSize: this.data.pageSize, lastCreatedAt }
      });

      const newPhotos = res.result.data.photos.map(p => ({
        ...p,
        takenAtFormatted: util.formatDateTime(p.takenAt)
      }));

      const fileList = newPhotos.map(p => p.imageUrl).filter(Boolean);
      if (fileList.length > 0) {
        const tempRes = await wx.cloud.getTempFileURL({ fileList });
        const urlMap = {};
        tempRes.fileList.forEach(f => { urlMap[f.fileID] = f.tempFileURL; });
        newPhotos.forEach(p => { p.imageUrl = urlMap[p.imageUrl] || p.imageUrl; });
      }

      this.setData({
        photos: [...this.data.photos, ...newPhotos],
        hasMore: res.result.data.hasMore
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideNavigationBarLoading();
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/photo-detail/photo-detail?photoId=${id}` });
  },

  goToUpload() {
    wx.navigateTo({ url: `/pages/upload/upload?spaceId=${this.data.spaceId}` });
  }
});