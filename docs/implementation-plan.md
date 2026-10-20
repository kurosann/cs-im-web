# CS IM Web V1 实施方案

> V2b 的增量实现与验收说明见 `docs/v2b-implementation.md`。

日期：2026-10-18
适用仓库：`cs-im-web`

## 1. 本阶段目标

本阶段只实现 `cs-im-web` 的 V1 前端体验，暂不接入、依赖或修改 `cs-im-server`。

交付目标：

- 把 3002 的 PC Web 原型实现为可操作的 Next.js 页面；
- 使用本地 Mock 数据完成页面展示和主要交互；
- 建立清晰的数据访问边界，为未来接入真实 API 预留替换点；
- 页面在桌面和窄屏浏览器中可用；
- V1 不因为后端接口未定而阻塞。

本阶段明确不做：

- 真实登录、权限校验和后端会话；
- 真实数据库、AccessToken、租户鉴权；
- WebSocket、SSE、Webhook 投递；
- 真实消息发送和外部渠道调用；
- AI 模型、知识库检索和转发执行；
- V2 的 AI 员工、知识库、智能分配和提醒中心。

## 2. V1 页面范围

正式 Web 只实现原型中的 V1 工作台：

| 页面 | 路由 | 交互 |
| --- | --- | --- |
| 总览 | `/` | 查看服务概况、待处理会话、渠道状态和失败提示 |
| 会话 | `/conversations` | 状态筛选、关键词搜索、查看负责人、进入聊天室 |
| 聊天室 | `/chat?conversationId=` | 查看消息、发送文本、认领、人工接管、关闭、转发 |
| 业务渠道 | `/apps` | 查看 App、上线/离线、注册模拟 App、查看心跳 |
| 转发渠道 | `/channels` | 查看渠道、编辑配置、测试、启用/停用 |
| AI 客服 | `/ai` | 查看和编辑三态策略、查看 AI 执行记录 |
| Webhook | `/webhook` | 新建、编辑、测试、启用/停用、删除 |
| 消息日志 | `/logs` | 按状态、时间和 Message ID 查看 Mock 投递日志 |
| 设置 | `/settings` | 编辑 Mock 租户信息和展示角色权限 |

V1 页面不在首屏显示 V2 入口。未来 V2 应通过独立路由和独立导航加入。

### 登录入口（Phase 0）

虽然 V1 不接入真实认证，但正式 Web 需要一个可运行的工作台入口。因此先加入：

- `/login` 登录页；
- `/register` 注册页；
- `/privacy` 隐私政策页；
- `/terms` 用户协议页；
- 演示邮箱/账号和密码校验；
- 本地注册账号保存和登录；
- 登录和注册的隐私政策、用户协议同意校验；
- `localStorage` / `sessionStorage` 保存本地 Mock session；
- 工作台路由的客户端守卫；
- 统一 Shell 的退出登录；
- 登录成功后跳转 `/`，未登录访问工作台跳转 `/login`。

登录页明确标注为演示模式，不保存真实密码，也不连接 `cs-im-server`。

## 3. 实现原则

### 3.1 Mock-first

所有页面先通过本地 Mock 数据运行，不请求远程服务，不依赖网络。

Mock 交互必须有真实的状态变化，例如：

- 发送消息后，消息出现在当前聊天室；
- 认领后，会话负责人和状态更新；
- 关闭后，会话从“进行中”变为“已关闭”；
- 启用/停用渠道后，状态标签和按钮同步变化；
- 测试渠道、测试 Webhook 后，显示成功或失败结果；
- 编辑配置后，重新进入页面仍能看到本次会话内的结果。

### 3.2 数据访问隔离

页面和组件不能直接维护整套业务 Mock 数据。统一经过 Repository：

```text
页面组件
  -> feature hooks / store
  -> repository
  -> MockRepository（V1 默认）
  -> RemoteRepository（后续替换）
```

V1 推荐先使用 React Context + `useReducer`，不引入重量级状态库。数据访问接口稳定后，再根据实时需求决定是否引入 TanStack Query。

### 3.3 原型和正式页面分离

可以复用 `cs-im-route-prototype` 的：

- 页面信息架构；
- 视觉 Token；
- 交互方向；
- Mock 数据样例。

不能直接复制：

- 页面内散落的 `useState` 业务数据；
- 只通过按钮改变局部文本的假交互；
- V2 页面代码；
- 依赖原型工程路径的组件或资源。

## 4. 推荐目录结构

```text
cs-im-web/
├── docs/
│   └── implementation-plan.md
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── conversations/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── apps/page.tsx
│   │   ├── channels/page.tsx
│   │   ├── ai/page.tsx
│   │   ├── webhook/page.tsx
│   │   ├── logs/page.tsx
│   │   └── settings/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── conversations/
│   │   ├── chat/
│   │   ├── channels/
│   │   └── ui/
│   ├── features/
│   │   ├── conversations/
│   │   ├── messages/
│   │   ├── apps/
│   │   ├── relay-channels/
│   │   ├── ai/
│   │   ├── webhooks/
│   │   ├── logs/
│   │   └── settings/
│   ├── data/
│   │   ├── mock/
│   │   ├── repository.ts
│   │   └── mock-repository.ts
│   ├── models/
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── app.ts
│   │   ├── relay-channel.ts
│   │   └── webhook.ts
│   ├── state/
│   │   └── workspace-store.tsx
│   └── lib/
│       ├── query-string.ts
│       ├── format-time.ts
│       └── cn.ts
└── package.json
```

## 5. Mock 数据模型

V1 只定义 UI 所需字段，避免提前复制后端完整模型。

### Conversation

```ts
type ConversationStatus = "waiting" | "ai" | "human" | "closed";

type Conversation = {
  id: string;
  customerName: string;
  customerId: string;
  channel: string;
  lastMessage: string;
  updatedAt: string;
  status: ConversationStatus;
  assignee: string | null;
  unreadCount: number;
  risk: "low" | "medium" | "high";
};
```

### Message

```ts
type Message = {
  id: string;
  conversationId: string;
  role: "customer" | "agent" | "ai" | "system";
  text: string;
  createdAt: string;
  status: "received" | "sent" | "delivered" | "failed";
};
```

### 其他模型

- `BusinessApp`：名称、App ID、在线状态、最近心跳、今日会话数；
- `RelayChannel`：名称、类型、目标、连接状态、今日投递数、失败率；
- `Webhook`：名称、URL、事件、状态、最近测试结果；
- `DeliveryLog`：Message ID、会话、方向、渠道、状态、失败原因、时间；
- `AiPolicy`：名称、匹配条件、动作 `reply | ignore | escalate`、启用状态；
- `TenantSettings`：租户名称、默认语言、会话超时、角色人数。

## 6. Repository 接口

V1 默认实现 `MockRepository`，但接口命名按未来真实数据源设计：

```ts
interface WorkspaceRepository {
  listConversations(filter?: ConversationFilter): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation>;
  listMessages(conversationId: string): Promise<Message[]>;
  sendMessage(input: SendMessageInput): Promise<Message>;
  assignConversation(id: string, assignee: string): Promise<Conversation>;
  closeConversation(id: string, reason?: string): Promise<Conversation>;
  forwardConversation(id: string, channelId: string): Promise<DeliveryLog>;

  listApps(): Promise<BusinessApp[]>;
  setAppStatus(id: string, enabled: boolean): Promise<BusinessApp>;
  registerApp(input: RegisterAppInput): Promise<BusinessApp>;

  listRelayChannels(): Promise<RelayChannel[]>;
  saveRelayChannel(input: RelayChannelInput): Promise<RelayChannel>;
  testRelayChannel(id: string): Promise<TestResult>;
  setRelayChannelStatus(id: string, enabled: boolean): Promise<RelayChannel>;

  listAiPolicies(): Promise<AiPolicy[]>;
  saveAiPolicy(input: AiPolicyInput): Promise<AiPolicy>;
  listWebhooks(): Promise<Webhook[]>;
  saveWebhook(input: WebhookInput): Promise<Webhook>;
  testWebhook(id: string): Promise<TestResult>;
  deleteWebhook(id: string): Promise<void>;
  listDeliveryLogs(filter?: LogFilter): Promise<DeliveryLog[]>;
  getSettings(): Promise<TenantSettings>;
  saveSettings(settings: TenantSettings): Promise<TenantSettings>;
}
```

Repository 内部使用内存对象或 `localStorage` 持久化。建议默认使用内存状态，增加“重置演示数据”操作；需要刷新后保留时再启用版本化 `localStorage`。

## 7. 页面实现要求

### 7.1 统一工作台 Shell

- 左侧固定导航，宽度约 240px；
- 右侧内容最大宽度约 1600px；
- 顶部展示当前页面标题、演示租户和角色；
- 窄屏下左侧导航改为抽屉；
- 所有页面共享 loading、error、empty 状态组件；
- 页面之间通过 Next.js 路由跳转，不用单页锚点模拟路由。

### 7.2 会话列表

- 支持“全部 / 待人工 / AI 处理中 / 人工处理中 / 已关闭”；
- 支持客户名、客户 ID、渠道和最近消息关键词搜索；
- 行内展示客户、渠道、最近消息、状态、负责人和更新时间；
- “进入聊天室”携带 `conversationId`；
- 筛选条件写入 URL query，刷新后保持；
- 无结果时显示空状态，不显示空白表格。

### 7.3 聊天室

- 桌面端三栏：会话列表 320px、聊天区自适应、客户信息 360px；
- 消息区区分客户、AI、客服和系统事件；
- 文本发送支持 Enter 发送、Shift+Enter 换行；
- 发送期间禁用发送按钮，避免重复添加；
- 支持认领、人工接管、关闭、转发；
- 转发结果展示在会话投递记录中；
- 通过 query 参数打开指定会话，找不到会话时显示错误状态。

### 7.4 渠道、AI、Webhook、日志、设置

所有配置页都遵循：

1. 列表；
2. 新建/编辑表单；
3. 测试或启停操作；
4. 成功/失败反馈；
5. 删除或危险操作确认；
6. 操作后刷新或更新 Repository 状态。

## 8. 视觉实现

以原型设计规范为基线：

- 页面背景：`#F8FAFC`；
- Surface：`#FFFFFF`；
- 主文字：`#0F172A`；
- 次文字：`#64748B`；
- 边框：`#E2E8F0`；
- Primary：`#2563EB`；
- Success：`#16A34A`；
- Warning：`#F59E0B`；
- Error：`#DC2626`；
- AI/Info：`#0EA5E9`。

V1 先完成浅色主题，组件结构保留深色主题扩展点。页面应优先使用现有 shadcn/ui 组件和 Lucide 图标，不重新造一套组件系统。

## 9. 实施阶段

### Phase 0：工程基础

1. 建立 Mock 登录页、session 工具、工作台路由守卫和退出登录；
2. 建立 V1 路由和统一 Shell；
3. 补齐 Button、Input、Textarea、Select、Badge、Table、Dialog、Sheet、Toast、Skeleton、EmptyState；
4. 定义模型、Repository 和 `WorkspaceStore`；
5. 搭建 Mock 数据和重置演示数据功能；
6. 建立通用错误处理和 URL query 工具。

验收：`/login` 可匿名访问；演示登录成功后进入工作台；刷新和退出登录行为符合约定；所有 V1 路由可访问，页面不再是空卡片，业务数据全部来自 Mock Repository。

### Phase 1：坐席闭环

1. 总览；
2. 会话列表；
3. 聊天室；
4. 消息发送；
5. 认领、人工接管、关闭；
6. 客户信息和会话投递记录。

验收：用户可以从会话列表进入聊天室，发送消息并看到列表预览、负责人和状态变化。

### Phase 2：配置闭环

1. 业务渠道；
2. 转发渠道；
3. Webhook；
4. AI 客服；
5. 消息日志；
6. 设置。

验收：每个页面都能完成新增/编辑/测试/启停等原型中展示的主要操作。

### Phase 3：质量和发布

1. 完善 loading、empty、error、confirm、toast；
2. 补桌面和窄屏响应式；
3. 增加单元测试；
4. 增加 Playwright 页面流程测试；
5. 执行 `pnpm lint`、`pnpm build`；
6. 更新 README，说明 V1 为 Mock-first。

## 10. 测试和验收

### 必测流程

1. 首页进入会话列表；
2. 按状态和关键词筛选；
3. 打开指定会话；
4. 发送文本消息；
5. 认领并关闭会话；
6. 创建和停用业务 App；
7. 创建、测试和停用转发渠道；
8. 创建、测试和删除 Webhook；
9. 编辑 AI 策略；
10. 筛选消息日志；
11. 修改设置并返回页面；
12. 刷新后验证演示数据重置或持久化行为符合约定。

### 质量要求

- `pnpm lint` 通过；
- `pnpm build` 通过；
- 关键交互有组件测试；
- 关键路径有 Playwright 测试；
- 不依赖 3001、3002 或任何远程服务；
- 不把真实 Token、密码或外部地址写入源码；
- 页面在 1440px 和 390px 宽度下无明显横向溢出。

## 11. 后续接入真实后端

真实后端不属于 V1 的完成条件。未来只需要新增：

```text
RemoteRepository implements WorkspaceRepository
```

页面、组件和状态层不直接改成 `fetch`。接入时再补：

- 登录和 Token 管理；
- API DTO 到 UI 模型的 mapper；
- 真实分页和错误码；
- SSE/WebSocket；
- 权限和租户；
- 文件上传和消息投递。

这样可以保证 V1 前端先完成体验验证，后端接口变化不会污染页面组件。

## 12. 完成定义

`cs-im-web` V1 满足以下条件即可交付：

- 3002 原型中列出的 V1 页面均有正式路由；
- 主要展示和操作均可通过 Mock Repository 完成；
- 页面不依赖 `cs-im-server`、3001 或 3002；
- 主要操作具备成功、失败、加载和空状态；
- 桌面和窄屏布局可用；
- lint、build 和关键流程测试通过；
- README 和本文档明确说明当前为 Mock-first V1。
