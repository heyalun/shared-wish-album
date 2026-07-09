// miniprogram/app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d3giuyj0r8a497b5d',
      traceUser: true
    });
    this.globalData = {
      userInfo: null,
      openid: null
    };
  },

  async login() {
    const res = await wx.cloud.callFunction({ name: 'login' });
    this.globalData.userInfo = res.result.data.user;
    this.globalData.openid = res.result.data.user.openid;
    return res.result.data.user;
  }
});