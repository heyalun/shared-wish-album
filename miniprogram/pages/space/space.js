// miniprogram/pages/space/space.js
Page({
  data: {
    spaceId: '',
    spaceName: '',
    currentTab: 0,
    tabs: ['相册', '心愿']
  },

  onLoad(options) {
    const spaceId = options.spaceId;
    this.setData({ spaceId });
    this.loadSpaceInfo();
  },

  async loadSpaceInfo() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('spaces').doc(this.data.spaceId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ spaceName: res.data[0].name });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  goToPhotos() {
    wx.navigateTo({ url: `/pages/photos/photos?spaceId=${this.data.spaceId}` });
  },

  goToWishes() {
    wx.navigateTo({ url: `/pages/wishes/wishes?spaceId=${this.data.spaceId}` });
  },

  goToSettings() {
    wx.navigateTo({ url: `/pages/space-settings/space-settings?spaceId=${this.data.spaceId}` });
  }
});