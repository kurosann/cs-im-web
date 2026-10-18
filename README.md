# cs-im-web

CS IM 的正式 Web 前端工程，用于承接客服工作台和后续产品页面。

当前按 V1 Mock-first 方案开发：使用 Next.js App Router、Tailwind CSS 4 和 shadcn/ui，已建立登录注册、统一工作台 Shell、总览、会话列表和聊天室基础交互。

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

## 当前边界

当前登录为纯前端 Mock session：

- 注册入口：`/register`
- 隐私政策：`/privacy`
- 用户协议：`/terms`
- 演示账号：`demo`
- 演示邮箱：`demo@cs-im.local`
- 演示密码：`demo1234`
- 登录框支持使用演示账号、演示邮箱或本地注册账号
- 登录和注册需要勾选同意隐私政策与用户协议
- 注册账号仅保存在当前浏览器的本地存储中
- 只保存在浏览器的 `localStorage` / `sessionStorage`
- 不连接 `cs-im-server`、3001 或 3002

V1 后续会继续补齐业务渠道、转发渠道、AI、Webhook、日志和设置页面。真实登录、AccessToken、权限和远程 API 不属于当前 V1 完成条件。
