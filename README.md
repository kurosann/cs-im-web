# cs-im-web

CS IM 的正式 Web 前端工程，用于承接客服工作台和后续产品页面。

当前按 V1 + V2b Mock-first 方案开发：使用 Next.js App Router、Tailwind CSS 4 和 shadcn/ui，已建立统一工作台 Shell、V1 基础页面，以及 AI 辅助回复、自动翻译、会话摘要、情绪风险、智能分配、AI 客服员工、知识库和基础提醒。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui 与 Radix UI
- pnpm

## 启动

```bash
pnpm install
pnpm dev
```

默认访问：

```text
http://localhost:3000
```

## 构建与检查

```bash
pnpm build
pnpm lint
```

## 工程约定

- 页面放在 `app/`。
- 复用 UI 组件放在 `components/`。
- 后续业务 API 调用通过 `cs-im-sdk` 或独立 API client 层封装，不在组件里散落硬编码。
- 字体和静态资源本地化在 `public/`，避免运行时依赖外部 CDN。

## V2b 入口

V2b 功能同时提供独立验收入口和工作台入口：

| 页面 | V2b 验收入口 | 工作台入口 |
| --- | --- | --- |
| 总览 | `/v2` | `/` |
| 聊天室 | `/v2/chat` | `/chat` |
| AI 客服员工 | `/v2/employee` | `/employee` |
| 知识库 | `/v2/knowledge` | `/knowledge` |
| 智能分配 | `/v2/assign` | `/assign` |
| 基础提醒 | `/v2/reminders` | `/reminders` |

详细功能说明和验收清单见 [`docs/v2b-implementation.md`](docs/v2b-implementation.md)。

## cs-im-server 联调

渠道接入页已经接到 cs-im-server 现有的管理接口：

| 页面能力 | cs-im-server 接口 |
| --- | --- |
| 业务渠道列表 | `GET /admin/v1/iam/tokens` |
| 创建业务渠道并签发 SecretKey | `POST /admin/v1/iam/tokens` |
| 轮换 SecretKey | `POST /admin/v1/iam/tokens/:tokenKey/rotate` |
| 启用/禁用业务凭证 | `POST /admin/v1/iam/tokens/:tokenKey/{enable,disable}` |
| 转发渠道列表/创建/启停/测试 | `GET/POST /admin/v1/channels`、`POST /admin/v1/channels/:id/{enable,disable,test}` |

启动时配置：

```bash
CS_IM_API_BASE=http://127.0.0.1:8080 \
CS_IM_ADMIN_TOKEN=dev-access-token \
pnpm dev
```

- `/api/admin/*` 是 Next.js 的 BFF 路由，`CS_IM_ADMIN_TOKEN` 只保存在服务端，不会通过 `NEXT_PUBLIC_` 暴露到浏览器。当前 BFF 未校验员工会话，仅用于本地联调；上线前必须接入员工登录/会话校验。
- 开发环境未配置 `CS_IM_ADMIN_TOKEN` 时默认使用引导 Token `dev-access-token`；生产环境必须配置具备 `iam:token:manage` scope 的专用 Token，否则 BFF 会返回配置错误。
- cs-im-server 不可达时，渠道接入页会显示「示例数据」并保留本地 Mock，不影响页面验收。
- 团队、角色、审计页面对应的员工/角色/审计接口尚未出现在 cs-im-server，本轮仍保留 Mock。

## 当前边界

- 登录通过 `POST /api/v1/auth/login`，默认转发到 `CS_IM_API_BASE`（`http://127.0.0.1:8080`）；注册由管理员在 IAM 中开通，前端不再提供自主注册。
- 纯前端页面验收可以注入本地 mock session，见 `docs/scripts/validation/verify_v2_workbench.py`。
- 渠道接入页在有 cs-im-server 时读取真实 IAM Token 和转发渠道；后端不可用时回退示例数据。其余业务数据仍为前端 Mock：会话、消息、AI 建议、翻译、摘要、分配规则和提醒不写入真实数据库。
- V2b 的 AI 建议、翻译、摘要、情绪风险和知识命中为 Mock 交互，不调用真实模型、翻译服务或消息网关。
- 页面不直接依赖 3001 / 3002 原型服务。

V2b 后续接入真实后端时，保持页面和组件不变，将 Mock 数据替换为 Repository / API client 即可。
