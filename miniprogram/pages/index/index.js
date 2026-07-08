// miniprogram/pages/index/index.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    spaces: [],
    loading: true
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (this.data.isLoggedIn) {
      this.loadSpaces();
    }
  },

  async checkLogin() {
    try {
      const user = await app.login();
      this.setData({ isLoggedIn: true });
      this.loadSpaces();
    } catch (err) {
      this.setData({ isLoggedIn: false, loading: false });
    }
  },

  async handleLogin() {
    wx.showLoading({ title: '登录中...' });
    try {
      await app.login();
      this.setData({ isLoggedIn: true });
      this.loadSpaces();
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async loadSpaces() {
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const openid = app.globalData.openid;
      const res = await db.collection('spaces').where({
        members: db.command.in([openid])
      }).get();
      this.setData({ spaces: res.data, loading: false });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async handleCreateSpace() {
    const res = await wx.showModal({
      title: '新建空间',
      editable: true,
      placeholderText: '输入空间名称'
    });
    if (!res.confirm || !res.content) return;

    wx.showLoading({ title: '创建中...' });
    try {
      const result = await wx.cloud.callFunction({
        name: 'createSpace',
        data: { name: res.content }
      });
      wx.hideLoading();
      await wx.showModal({
        title: '创建成功',
        content: `邀请码：${result.result.data.space.inviteCode}\n分享给 TA 吧！`,
        showCancel: false
      });
      this.loadSpaces();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  },

  async handleJoinSpace() {
    const res = await wx.showModal({
      title: '加入空间',
      editable: true,
      placeholderText: '输入6位邀请码'
    });
    if (!res.confirm || !res.content) return;

    wx.showLoading({ title: '加入中...' });
    try {
      await wx.cloud.callFunction({
        name: 'joinSpace',
        data: { inviteCode: res.content.trim().toUpperCase() }
      });
      wx.hideLoading();
      wx.showToast({ title: '加入成功', icon: 'success' });
      this.loadSpaces();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '加入失败', icon: 'none' });
    }
  },

  handleOpenSpace(e) {
    const spaceId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/space/space?spaceId=${spaceId}` });
  }
});