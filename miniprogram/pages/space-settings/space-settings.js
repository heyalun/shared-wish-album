// miniprogram/pages/space-settings/space-settings.js
const util = require('../../utils/util');

Page({
  data: {
    spaceId: '',
    space: null,
    inviteCode: '',
    members: [],
    createdAtFormatted: ''
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
    this.loadSpaceInfo();
  },

  onShow() {
    if (this.data.spaceId) {
      this.loadSpaceInfo();
    }
  },

  async loadSpaceInfo() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('spaces').doc(this.data.spaceId).get();
      if (res.data) {
        const space = res.data;
        const createdAtFormatted = util.formatDateTime(space.createdAt);
        this.setData({ space, inviteCode: space.inviteCode, createdAtFormatted });
        this.loadMembers(space.members);
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async loadMembers(memberIds) {
    if (!memberIds || memberIds.length === 0) {
      this.setData({ members: [] });
      return;
    }
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        openid: db.command.in(memberIds)
      }).get();
      this.setData({ members: res.data || [] });
    } catch (err) {
      this.setData({ members: [] });
    }
  },

  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '已复制邀请码', icon: 'success' });
      }
    });
  },

  deleteSpace() {
    wx.showModal({
      title: '删除空间',
      content: '确定要删除这个空间吗？所有照片和心愿将被永久删除，不可恢复。',
      confirmText: '删除',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await wx.cloud.callFunction({
            name: 'deleteSpace',
            data: { spaceId: this.data.spaceId }
          });
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack({ delta: 2 });
          }, 1500);
        } catch (err) {
          wx.showToast({ title: err.message || '删除失败', icon: 'none' });
        }
      }
    });
  }
});