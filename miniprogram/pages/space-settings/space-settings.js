// miniprogram/pages/space-settings/space-settings.js
Page({
  data: {
    spaceId: '',
    space: null,
    inviteCode: ''
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadSpaceInfo();
  },

  async loadSpaceInfo() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('spaces').doc(this.data.spaceId).get();
      if (res.data && res.data.length > 0) {
        this.setData({ space: res.data[0], inviteCode: res.data[0].inviteCode });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' });
      }
    });
  }
});