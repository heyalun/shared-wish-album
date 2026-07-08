// miniprogram/pages/upload/upload.js
Page({
  data: {
    spaceId: '',
    imagePath: '',
    takenAt: '',
    locationName: '',
    caption: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ spaceId: options.spaceId });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ imagePath: res.tempFilePaths[0] });
      }
    });
  },

  onDateChange(e) {
    this.setData({ takenAt: e.detail.value });
  },

  onLocationInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async submit() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请选择照片', icon: 'none' });
      return;
    }
    if (!this.data.takenAt) {
      wx.showToast({ title: '请选择拍摄时间', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '上传中...' });

    try {
      const cloudPath = `spaces/${this.data.spaceId}/photos/${Date.now()}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.imagePath
      });

      await wx.cloud.callFunction({
        name: 'uploadPhoto',
        data: {
          spaceId: this.data.spaceId,
          fileName: cloudPath,
          imageUrl: uploadRes.fileID,
          takenAt: new Date(this.data.takenAt).getTime(),
          locationName: this.data.locationName || undefined,
          caption: this.data.caption || undefined
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '上传失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});