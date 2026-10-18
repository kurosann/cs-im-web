# cs-im-web

CS IM 的正式 Web 前端工程，用于承接客服工作台和后续产品页面。

当前是工程骨架阶段：使用 Next.js App Router、Tailwind CSS 4 和 shadcn/ui，首页提供基础界面占位。

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

尚未接入后端登录、会话列表和消息流。相关能力会先在后端和 Demo 前端联调，再迁移到本工程。
