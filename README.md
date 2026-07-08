# 共享心愿相册 (Shared Wish Album)

一个微信小程序，供亲密关系（情侣、朋友、家人）之间共享照片和心愿记录。
**30 秒说明**：你和 TA 的专属相册 + 心愿清单，记录过去的地方，写下想去的地方，一起完成彼此的愿望。

## 功能

- 创建共享空间，邀请他人加入
- 上传照片，附带时间、地点、感受
- 记录心愿（美食/旅游/其他），标记完成
- 多空间管理，与不同的人共享

## 技术栈

- 微信小程序（原生）
- 微信云开发（云数据库、云存储、云函数）
- Node.js 云函数
- Jest 测试
- Vercel 静态托管（Web 管理后台）

## 目录结构

```
├── SPEC.md             # 设计文档
├── PLAN.md             # 实现计划
├── README.md           # 本文档
├── cloudfunctions/     # 云函数（Node.js）
├── miniprogram/        # 小程序前端代码
├── web-admin/          # Web 管理后台
├── tests/              # 云函数单元测试
└── .gitlab-ci.yml      # CI 配置
```

## 本地开发

### 前端（小程序）
1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 在 `app.js` 中配置云开发环境 ID
4. 编译运行

### 云函数测试
```bash
npm install
npm test
```

### Web 管理后台

```bash
cd web-admin
npx serve .
```

## 分发

### 小程序
通过微信审核后发布，用户扫码或搜索即可使用。

### Web 管理后台

部署到 Vercel：
```bash
cd web-admin
vercel --prod
```

## 凭据与安全
本项目不涉及 LLM API Key 或第三方付费 API。用户授权通过微信 OAuth 完成，openid 由云函数安全获取。云数据库使用安全规则控制数据访问权限。

## 已知限制

- 需在微信开发者工具中运行小程序
- 云开发环境需在微信公众平台配置
- 当前版本不含 AI 功能
- 图片上传限制 10MB

## License

MIT