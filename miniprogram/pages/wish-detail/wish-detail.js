// miniprogram/pages/wish-detail/wish-detail.js
Page({
  data: {
    wish: null,
    wishId: '',
    typeLabels: { food: '美食', travel: '旅游', other: '其他' }
  },

  onLoad(options) {
    this.setData({ wishId: options.wishId });
    this.loadWish();
  },

  onShow() {
    if (this.data.wishId) {
      this.loadWish();
    }
  },

  async loadWish() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('wishes').doc(this.data.wishId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ wish: res.data[0] });
      } else {
        wx.showToast({ title: '心愿不存在', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async completeWish() {
    const wishId = this.data.wishId;
    const that = this;
    wx.showModal({
      title: '确认完成',
      content: '确定要标记这个心愿为已完成吗？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await wx.cloud.callFunction({
            name: 'completeWish',
            data: { wishId: wishId }
          });
          wx.showToast({ title: '心愿已完成！', icon: 'success' });
          that.loadWish();
        } catch (err) {
          wx.showToast({ title: err.message || '操作失败', icon: 'none' });
        }
      }
    });
  }
});