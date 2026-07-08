// miniprogram/pages/wish-create/wish-create.js
Page({
  data: {
    spaceId: '',
    title: '',
    type: 'food',
    types: [
      { value: 'food', label: '美食' },
      { value: 'travel', label: '旅游' },
      { value: 'other', label: '其他' }
    ],
    location: '',
    note: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  async submit() {
    const { title, type, location, note } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入心愿标题', icon: 'none' });
      return;
    }
    if (title.length > 100) {
      wx.showToast({ title: '标题不能超过100字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await wx.cloud.callFunction({
        name: 'createWish',
        data: { spaceId: this.data.spaceId, title: title.trim(), type, location: location || undefined, note: note || undefined }
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});