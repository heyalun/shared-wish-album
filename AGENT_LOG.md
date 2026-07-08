# AGENT_LOG.md — 智能体协作开发日志

**项目**：共享心愿相册（Shared Wish Album）
**日期**：2026-07-08

---

## 日志条目

### 2026-07-08 10:15 — brainstorming 启动

- **技能**：`superpowers:brainstorming`
- **触发**：用户提出"创建一个可以上传照片，记录心愿的微信小程序，可以双人使用，共享信息"
- **关键交互**：通过 5 轮追问确定了目标用户（亲密关系）、多空间模型、核心功能范围、照片+心愿关联、无 LLM 调用
- **产出**：完整设计（架构、数据模型、页面规划、权限设计）
- **教训**：用户最初说"双人使用"，追问后改为"多空间"——初始需求常常不准确，需要追问来澄清

### 2026-07-08 10:30 — 课程要求对齐

- **技能**：`superpowers:brainstorming`（继续）
- **触发**：用户提供了课程要求文件（AI4SE_Final_Project_B + 通用要求）
- **关键交互**：发现设计文档与课程要求有 7 项差距，补充了用户故事、验收标准、凭据设计、Web 管理后台等
- **干预**：用户选择不使用 Open Design、不调用 LLM API、Web 后台方案 B
- **产出**：修订后的 SPEC.md（10 个章节，符合课程要求）
- **教训**：应该在一开始就要求用户提供所有约束条件（课程要求），避免重复工作

### 2026-07-08 10:50 — SPEC 签署 & 转 writing-plans

- **技能**：`superpowers:brainstorming` → `superpowers:writing-plans`
- **产出**：`D:\vibe-project\SPEC.md`（完整设计文档）
- **SPEC 自检**：无占位符、无矛盾、范围清晰

### 2026-07-08 10:55 — 实现计划生成

- **技能**：`superpowers:writing-plans`
- **产出**：`D:\vibe-project\PLAN.md`（17 个任务，含详细代码、测试、接口定义）
- **计划自检**：修复了 mock 的 `$lt`/`$gt` 操作符、`uploadPhoto` 改为接收 `imageUrl`、`jest.config.js` 修复
- **教训**：计划中的 mock 必须在写代码前就考虑所有操作符，否则测试会失败

### 2026-07-08 10:59 — 子代理驱动开发启动

- **技能**：`superpowers:subagent-driven-development`
- **操作**：初始化 git、创建 `.superpowers/sdd/` 工作区、提取 17 个 task brief
- **模型选择**：全部使用 `general` 子代理（项目规模适中，无需分 tier）

---

### Task 1: 项目脚手架
- **Commit**：`27696b4` — chore: initialize project with jest and WeChat SDK mock
- **状态**：DONE_WITH_CONCERNS
- **关注**：Node.js 未安装，`npm install` 和 `npm test` 无法运行
- **干预**：无——环境问题，非代码问题

### Task 2-10: 云函数开发（并行）
- **技能**：`superpowers:subagent-driven-development` + `superpowers:test-driven-development`
- **子代理**：每个云函数一个独立的 `general` 子代理
- **Commit 记录**：

| Task | 云函数 | Commit | 测试 |
|------|--------|--------|------|
| 2 | login | `6385cb5` | 3/3 |
| 3 | createSpace | `0033117` | 4/4 |
| 4 | joinSpace | `8e6f3a3` | 4/4 |
| 5 | uploadPhoto | `64e1297` | 4/4 |
| 6 | getPhotos | `8e9bc21` | 3/3 |
| 7 | createWish | `5bc3da0` | 6/6 |
| 8 | getWishes | `57269e8` | 3/3 |
| 9 | completeWish | `b69d5d2` | 4/4 |
| 10 | getStats | `c6b7558` | 3/3 |

- **TDD 证据**：每个子代理均先写失败测试（RED），再实现（GREEN），共 34 个测试用例
- **干预**：无——所有子代理独立完成，无需人工修正
- **教训**：并行派发 9 个子代理在同一轮对话中完成，效率极高。但需要确保 task brief 足够详细，让子代理不依赖上下文。

### Task 11-15: 小程序页面（并行）
- **技能**：`superpowers:subagent-driven-development`
- **子代理**：每个页面组一个独立的 `general` 子代理
- **Commit 记录**：

| Task | 页面 | Commit |
|------|------|--------|
| 11 | App Shell + Login | `de6754a` |
| 12 | Space Home | `cc91160` |
| 13 | Photo Pages | `9be9bf3`, `4f29f4c` |
| 14 | Wish Pages | `4f29f4c`（合并） |
| 15 | Space Settings | `b3d1ce3` |

- **关注**：
  - Task 13 的 upload commit 意外包含了 Task 14 的 wish 页面文件（文件系统污染）
  - Task 14 的子代理发现 `wish-create.js` 缺少 `onInput` 处理函数，自行补充了
  - Task 14 的 `wish-detail.js` 中 `loadWish` 的 `res.data.length` 判断修正为 `if (res.data)`
- **干预**：无——子代理自行修正了代码中的问题
- **教训**：并行派发页面任务时，文件系统可能交叉污染。后续应该用 git worktree 隔离。

### Task 16: Web 管理后台
- **Commit**：`f7099fe` — feat: implement web admin dashboard
- **状态**：DONE
- **关注**：无

### Task 17: CI + README
- **Commit**：`c097667` — chore: add CI config and README
- **状态**：DONE
- **测试**：9 套件 / 34 测试 / 全部通过

---

### 2026-07-08 14:20 — 全部测试验证

- **命令**：`npm test`
- **结果**：9 passed, 34 passed, 34 total
- **耗时**：0.837s

### 2026-07-08 14:25 — 云函数目录结构修复

- **问题**：云函数原本是单文件 `.js`，微信云开发要求每个函数在独立子目录（`index.js` + `package.json`）
- **操作**：将 9 个云函数移入子目录，创建 `package.json`
- **副作用**：测试文件的 require 路径从 `../cloudfunctions/login` 变成了 `../cloudfunctions/login/index.js`，但 Node.js 自动解析目录下的 `index.js`，故无需修改测试文件
- **后续**：`package.json` 干扰了 Jest 模块解析，移除后恢复。这些 package.json 仅需在部署到微信云时存在。

### 2026-07-08 14:35 — 测试文件编码修复

- **问题**：PowerShell 的 `Set-Content -NoNewline` 破坏了测试文件中的中文字符（UTF-8 双重编码）
- **操作**：用 Node.js 脚本重写全部 9 个测试文件，确保 UTF-8 编码正确
- **教训**：Windows PowerShell 5.1 的编码处理不可靠，应该用 Node.js 或 cmd 的 `chcp 65001` 处理 UTF-8 文件。

---

## 技能使用统计

| 技能 | 使用次数 | 效果评价 |
|------|---------|----------|
| brainstorming | 1 次（持续 10+ 轮） | 非常有效，将模糊需求转化为结构化 SPEC |
| writing-plans | 1 次 | 产出了 17 个详细 task，代码精确到行 |
| subagent-driven-development | 1 次（17 个 task） | 并行派发效率高，子代理独立完成率高 |
| test-driven-development | 9 次（每个云函数） | TDD 被严格执行，34 个测试全部通过 |
| finishing-a-development-branch | 1 次 | 标准化收尾流程 |

## 关键教训总结

1. **约束条件前置**：课程要求应在 brainstorming 开始前提供，避免重复设计
2. **并行派发的文件隔离**：并行子代理可能产生文件系统交叉污染，应用 git worktree 隔离
3. **Windows 编码陷阱**：PowerShell 的 UTF-8 处理不可靠，应使用 Node.js 处理文本文件
4. **task brief 质量决定子代理成功率**：17 个任务中 15 个一次成功，2 个有轻微关注——task brief 越详细，子代理越不需要人工干预
5. **model 选择**：本项目全部使用 `general` 子代理，对于代码量小、逻辑清晰的任务完全够用，无需动用更强模型