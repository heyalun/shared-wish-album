# 共享心愿相册 (Shared Wish Album)

一个微信小程序，供亲密关系（情侣、朋友、家人）之间共享照片和心愿记录。
**30 秒说明**：你和 TA 的专属相册 + 心愿清单，记录过去的地方，写下想去的地方，一起完成彼此的愿望。

## 功能

- 创建共享空间，邀请他人加入
- 上传照片，附带时间、地点、感受
- 记录心愿（美食/旅游/其他），标记完成
- 多空间管理，与不同的人共享
- 空间管理（成员列表、邀请码、删除空间）

## 技术栈

- 微信小程序（原生）
- 微信云开发（云数据库、云存储、云函数）
- Node.js 云函数
- Jest 测试（38 tests, 10 suites）
- GitHub Pages（Web 管理后台）
- GitHub Actions（CI/CD）
- Docker（云函数测试容器化）

## 线上地址

- **Web 管理后台**：[https://heyalun.github.io/shared-wish-album](https://heyalun.github.io/shared-wish-album)
- **CI 状态**：[![CI](https://github.com/heyalun/shared-wish-album/actions/workflows/ci.yml/badge.svg)](https://github.com/heyalun/shared-wish-album/actions/workflows/ci.yml)

## 目录结构

```
├── SPEC.md                 # 设计文档
├── PLAN.md                 # 实现计划
├── SPEC_PROCESS.md         # 过程文档
├── AGENT_LOG.md            # 智能体协作日志
├── README.md               # 本文档
├── Dockerfile              # Docker 容器分发
├── .gitlab-ci.yml          # CI 配置
├── miniprogram/            # 微信小程序
│   ├── app.js / .json / .wxss
│   ├── utils/
│   ├── pages/              # 9 个页面
│   └── cloudfunctions/     # 10 个云函数
├── web-admin/              # Web 管理后台
├── tests/                  # 云函数单元测试
└── .github/workflows/      # GitHub Actions
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

### Docker 运行测试
```bash
docker build -t shared-wish-album .
docker run shared-wish-album
```

### Web 管理后台
```bash
cd web-admin
npx serve .
```

## 分发

### 小程序
通过微信审核后发布，用户扫码或搜索即可使用。开发阶段使用微信开发者工具导入 `miniprogram/` 目录。

### Docker 容器
```bash
docker build -t shared-wish-album .
docker run shared-wish-album
```
容器内运行全部云函数单元测试，适用于 CI/CD 或本地验证。

### Web 管理后台
通过 GitHub Pages 自动部署（push 到 main 分支自动触发）：
```
https://heyalun.github.io/shared-wish-album
```

如需连接实时数据，需在微信云开发控制台为 `getStats` 云函数开启 HTTP 访问，然后将 `web-admin/index.html` 中的 `API_URL` 替换为实际地址。

## 凭据与安全
本项目不涉及 LLM API Key 或第三方付费 API。用户授权通过微信 OAuth 完成，openid 由云函数安全获取。云数据库使用安全规则控制数据访问权限。

## 已知限制

- 需在微信开发者工具中运行小程序
- 云开发环境需在微信公众平台配置
- 当前版本不含 AI 功能
- 图片上传限制 10MB
- Web 管理后台默认使用演示数据，配置 HTTP 触发器后可连接实时数据

## License

MIT