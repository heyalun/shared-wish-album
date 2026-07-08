// miniprogram/pages/wishes/wishes.js
Page({
  data: {
    spaceId: '',
    activeFilter: 'all',
    filters: ['全部', '进行中', '已完成'],
    wishes: [],
    showDone: undefined
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadWishes();
  },

  onShow() {
    this.loadWishes();
  },

  async loadWishes() {
    try {
      const data = { spaceId: this.data.spaceId };
      if (this.data.showDone !== undefined) {
        data.done = this.data.showDone;
      }
      const res = await wx.cloud.callFunction({ name: 'getWishes', data });
      this.setData({ wishes: res.result.data.wishes });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  switchFilter(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeFilter: ['all', 'active', 'done'][index] });
    if (index === 0) this.setData({ showDone: undefined });
    else if (index === 1) this.setData({ showDone: false });
    else this.setData({ showDone: true });
    this.loadWishes();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/wish-detail/wish-detail?wishId=${id}` });
  },

  goToCreate() {
    wx.navigateTo({ url: `/pages/wish-create/wish-create?spaceId=${this.data.spaceId}` });
  }
});