export type KnowledgeDocStatus = "已发布" | "待审核" | "草稿"
export type KnowledgeDocType = "FAQ" | "政策" | "规则" | "模板"
export type KnowledgeLanguage = "中文" | "English" | "Español"

export type KnowledgeDoc = {
  id: string
  baseId: string
  title: string
  type: KnowledgeDocType
  language: KnowledgeLanguage
  status: KnowledgeDocStatus
  answer: string
  hits: number
  channels?: string[]
  effectiveAt?: string
  updatedAt?: string
  source?: string
}

export type KnowledgeBase = {
  id: string
  groupId: string
  name: string
  product: string
  description: string
}

export type KnowledgeGroup = {
  id: string
  name: string
}

export const knowledgeGroups: KnowledgeGroup[] = [
  { id: "g1", name: "电商产品线" },
  { id: "g2", name: "会员产品线" },
  { id: "g3", name: "海外产品线" },
]

export const knowledgeBases: KnowledgeBase[] = [
  { id: "kb1", groupId: "g1", name: "商品与库存库", product: "电商主站", description: "商品参数、活动规则、库存和发货。" },
  { id: "kb2", groupId: "g1", name: "售后政策库", product: "电商主站", description: "退款、退货、换货和赔付边界。" },
  { id: "kb3", groupId: "g2", name: "会员权益库", product: "星辰会员", description: "等级规则、折扣、券包和续费。" },
  { id: "kb4", groupId: "g3", name: "海外售后库", product: "Global Store", description: "English / Español refund and logistics policies." },
]

export const knowledgeDocs: KnowledgeDoc[] = [
  { id: "d1", baseId: "kb1", title: "春节发货时间", type: "FAQ", language: "中文", status: "已发布", answer: "春节期间只发货预付订单，2 月 8 日恢复全部发货。", hits: 186, channels: ["Web Chat", "Messenger"], effectiveAt: "2026-01-20", updatedAt: "2026-02-01", source: "手动问答对" },
  { id: "d2", baseId: "kb1", title: "商品优惠叠加规则", type: "规则", language: "中文", status: "已发布", answer: "限时折扣与优惠券可叠加，会员折不可叠加。", hits: 92, channels: ["Web Chat"], effectiveAt: "2026-01-01", updatedAt: "2026-01-18", source: "文档上传" },
  { id: "d3", baseId: "kb2", title: "退款多久到账？", type: "FAQ", language: "中文", status: "已发布", answer: "原路退回，1-2 个工作日到账；大额退款 3-5 个工作日。", hits: 268, channels: ["WhatsApp", "Telegram", "Web Chat"], effectiveAt: "2026-01-01", updatedAt: "2026-03-02", source: "历史会话沉淀" },
  { id: "d4", baseId: "kb2", title: "退货流程", type: "模板", language: "中文", status: "已发布", answer: "请提供订单号和商品照片，审核通过后生成退货码。", hits: 141, channels: ["WhatsApp", "Web Chat"], effectiveAt: "2026-01-01", updatedAt: "2026-02-14", source: "常用语导入" },
  { id: "d5", baseId: "kb3", title: "会员权益表", type: "规则", language: "中文", status: "待审核", answer: "普通会员 95 折，黑卡会员 88 折。", hits: 34, channels: ["Web Chat", "Messenger"], effectiveAt: "2026-04-01", updatedAt: "2026-03-20", source: "手动问答对" },
  { id: "d6", baseId: "kb3", title: "会员券包使用", type: "FAQ", language: "中文", status: "草稿", answer: "券包每月 1 日刷新，过期券不可补发。", hits: 0, channels: ["Web Chat"], effectiveAt: "2026-04-01", updatedAt: "2026-03-21", source: "文档上传" },
  { id: "d7", baseId: "kb4", title: "Refund policy", type: "政策", language: "English", status: "已发布", answer: "Refunds return to the original payment method within 1-2 business days.", hits: 121, channels: ["WhatsApp", "Telegram"], effectiveAt: "2026-01-01", updatedAt: "2026-03-12", source: "业务系统同步" },
  { id: "d8", baseId: "kb4", title: "Política de reembolso", type: "政策", language: "Español", status: "已发布", answer: "El reembolso llega en 1-2 días hábiles.", hits: 78, channels: ["WhatsApp"], effectiveAt: "2026-01-01", updatedAt: "2026-03-12", source: "业务系统同步" },
]

export type ChatStatus = "waiting" | "ai" | "human"
export type CustomerLanguage = "en" | "es" | "zh"
export type Sentiment = "positive" | "neutral" | "negative" | "angry"
export type RiskLevel = "low" | "medium" | "high"
export type ConversationPriority = "低" | "普通" | "高" | "紧急"
export type OwnerType = "human" | "ai" | "queue"
export type TranslationStatus = "ready" | "pending" | "failed" | "not_needed"
export type DeliveryStatus = "sent" | "sending" | "failed"
export type SuggestionAction = "generated" | "filled" | "used" | "modified" | "ignored" | "expired"
export type SuggestionTone = "正式" | "友好" | "简洁" | "安抚"

export type ChatMessage = {
  id: string
  role: "customer" | "agent" | "system" | "note"
  text: string
  translated?: string
  time: string
  sourceLanguage?: string
  targetLanguage?: string
  translationProvider?: string
  translationStatus?: TranslationStatus
  internalOnly?: boolean
  deliveryStatus?: DeliveryStatus
  aiSuggestionId?: string
  suggestionAction?: Exclude<SuggestionAction, "generated" | "filled" | "ignored">
  sentiment?: Sentiment
  riskLevel?: RiskLevel
}

export type CustomerProfile = {
  customerId: string
  level: string
  email: string
  phone: string
  region: string
  joinedAt: string
  totalOrders: number
  riskTags: string[]
}

export type CustomerOrder = {
  id: string
  product: string
  amount: string
  status: string
  updatedAt: string
}

export type CustomerHistory = {
  id: string
  date: string
  channel: string
  subject: string
  resolution: string
}

export type ChatConversation = {
  id: string
  name: string
  app: string
  preview: string
  time: string
  unreadCount: number
  status: ChatStatus
  language: CustomerLanguage
  languageLabel: string
  sentiment: Sentiment
  riskLevel: RiskLevel
  priority: ConversationPriority
  tags: string[]
  assignedTo: string
  ownerType: OwnerType
  team: string
  slaDueIn: string
  summary: string
  customer: CustomerProfile
  orders: CustomerOrder[]
  history: CustomerHistory[]
  context: {
    currentPage: string
    device: string
    source: string
  }
}

export const chatConversations: ChatConversation[] = [
  {
    id: "c1",
    name: "Maya",
    app: "WhatsApp",
    preview: "Llevo esperando casi una semana.",
    time: "12:34",
    unreadCount: 2,
    status: "waiting",
    language: "es",
    languageLabel: "西班牙语",
    sentiment: "negative",
    riskLevel: "medium",
    priority: "高",
    tags: ["退款", "催办", "海外"],
    assignedTo: "待分配",
    ownerType: "queue",
    team: "售后一组",
    slaDueIn: "3 分钟",
    summary:
      "客户 Maya 反馈订单 20241015001 退款未到账。客服已确认进入财务复核，预计 1-2 个工作日到账。客户情绪偏着急，需要继续跟进。",
    customer: {
      customerId: "C-10294",
      level: "金卡会员",
      email: "maya.rojas@example.com",
      phone: "+34 612 880 431",
      region: "西班牙 · Madrid",
      joinedAt: "2024-03-18",
      totalOrders: 12,
      riskTags: ["退款咨询", "跨语言"],
    },
    orders: [
      { id: "20241015001", product: "轻量旅行背包 × 1", amount: "€128.00", status: "退款复核中", updatedAt: "今天 09:40" },
      { id: "20240928014", product: "收纳套装 × 2", amount: "€56.00", status: "已签收", updatedAt: "09-30 16:12" },
    ],
    history: [
      { id: "h1", date: "2024-09-12", channel: "WhatsApp", subject: "物流延迟", resolution: "已补发优惠券" },
      { id: "h2", date: "2024-06-03", channel: "WhatsApp", subject: "优惠券叠加", resolution: "已解释规则" },
    ],
    context: {
      currentPage: "/orders/20241015001",
      device: "iPhone 15 · Safari",
      source: "WhatsApp Business",
    },
  },
  {
    id: "c2",
    name: "Lucía",
    app: "Telegram",
    preview: "Gracias por la ayuda.",
    time: "12:20",
    unreadCount: 0,
    status: "ai",
    language: "en",
    languageLabel: "英语",
    sentiment: "positive",
    riskLevel: "low",
    priority: "普通",
    tags: ["会员", "已解决"],
    assignedTo: "海外客服",
    ownerType: "ai",
    team: "AI 服务组",
    slaDueIn: "18 分钟",
    summary:
      "客户 Lucía 咨询会员权益生效时间。AI 客服已确认权益已生效，并引导客户到账户中心查看。客户表示满意，无需人工跟进。",
    customer: {
      customerId: "C-10318",
      level: "普通会员",
      email: "lucia.m@example.com",
      phone: "+34 655 120 889",
      region: "西班牙 · Barcelona",
      joinedAt: "2025-11-02",
      totalOrders: 3,
      riskTags: [],
    },
    orders: [
      { id: "20241012008", product: "星辰会员年卡", amount: "€89.00", status: "已完成", updatedAt: "10-12 10:20" },
    ],
    history: [
      { id: "h3", date: "2024-12-08", channel: "Telegram", subject: "会员券包", resolution: "AI 自动解决" },
    ],
    context: {
      currentPage: "/membership",
      device: "Android · Chrome",
      source: "Telegram Bot",
    },
  },
  {
    id: "c3",
    name: "Daniel",
    app: "Messenger",
    preview: "My account is locked.",
    time: "11:52",
    unreadCount: 1,
    status: "human",
    language: "en",
    languageLabel: "英语",
    sentiment: "angry",
    riskLevel: "high",
    priority: "紧急",
    tags: ["账号安全", "高风险", "投诉倾向"],
    assignedTo: "陈晓 · 售后二组",
    ownerType: "human",
    team: "售后二组",
    slaDueIn: "1 分钟",
    summary:
      "客户 Daniel 账户被锁定，无法登录，情绪愤怒并提及投诉。会话已升级至账号安全团队，需人工确认身份并给出明确处理时间。",
    customer: {
      customerId: "C-09981",
      level: "黑卡会员",
      email: "daniel.king@example.com",
      phone: "+1 415 220 7781",
      region: "美国 · San Francisco",
      joinedAt: "2023-08-09",
      totalOrders: 48,
      riskTags: ["账号安全", "投诉历史", "高价值客户"],
    },
    orders: [
      { id: "20241011031", product: "年度订阅 × 1", amount: "$299.00", status: "支付成功", updatedAt: "10-11 21:08" },
      { id: "20240930077", product: "配件套装 × 1", amount: "$64.00", status: "配送中", updatedAt: "10-01 08:30" },
    ],
    history: [
      { id: "h4", date: "2024-08-21", channel: "Messenger", subject: "发票问题", resolution: "人工解决" },
      { id: "h5", date: "2024-02-04", channel: "Messenger", subject: "账号验证", resolution: "安全团队介入" },
    ],
    context: {
      currentPage: "/login",
      device: "MacBook · Chrome",
      source: "Facebook Messenger",
    },
  },
]

export const chatMessagesByConversation: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", role: "customer", text: "Hola, quiero reembolsar mi pedido.", translated: "你好，我想申请订单退款。", time: "12:31", sourceLanguage: "Español", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "neutral", riskLevel: "low" },
    { id: "m2", role: "agent", text: "我已经帮你确认退款状态。", translated: "He confirmado el estado del reembolso.", time: "12:32", sourceLanguage: "中文", targetLanguage: "Español", translationProvider: "AI 翻译", translationStatus: "ready", deliveryStatus: "sent" },
    { id: "m3", role: "customer", text: "¿Cuánto tiempo tardará?", translated: "还需要等多久？", time: "12:34", sourceLanguage: "Español", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "negative", riskLevel: "medium" },
    { id: "m4", role: "system", text: "AI 已生成 3 条建议回复，等待人工确认。", time: "12:34" },
    { id: "m5", role: "customer", text: "Llevo esperando casi una semana.", translated: "我已经等了快一周了。", time: "12:35", sourceLanguage: "Español", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "negative", riskLevel: "medium" },
  ],
  c2: [
    { id: "m6", role: "customer", text: "Thanks for your help.", translated: "感谢你的帮助。", time: "12:18", sourceLanguage: "English", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "positive", riskLevel: "low" },
    { id: "m7", role: "agent", text: "你的会员权益已经生效，可以在账户中心查看。", translated: "Your membership benefits are now active. You can view them in your account center.", time: "12:19", sourceLanguage: "中文", targetLanguage: "English", translationProvider: "AI 翻译", translationStatus: "ready", deliveryStatus: "sent" },
    { id: "m8", role: "agent", text: "稍后我们会把电子发票发送到你的邮箱。", translated: "We will send the invoice to your email shortly.", time: "12:20", sourceLanguage: "中文", targetLanguage: "English", translationProvider: "AI 翻译", translationStatus: "ready", deliveryStatus: "failed" },
    { id: "m9", role: "customer", text: "Great, thank you.", translated: "太好了，谢谢。", time: "12:20", sourceLanguage: "English", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "positive", riskLevel: "low" },
  ],
  c3: [
    { id: "m10", role: "customer", text: "My account is locked and I can't log in.", translated: "我的账号被锁定了，无法登录。", time: "11:49", sourceLanguage: "English", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "negative", riskLevel: "high" },
    { id: "m11", role: "system", text: "检测到账号安全风险，AI 自动回复已暂停，已转人工。", time: "11:50" },
    { id: "m12", role: "agent", text: "我已将此事升级给账号安全团队，会在 30 分钟内联系您。", translated: "I have escalated this to account security. They will contact you within 30 minutes.", time: "11:51", sourceLanguage: "中文", targetLanguage: "English", translationProvider: "AI 翻译", translationStatus: "ready", deliveryStatus: "sent" },
    { id: "m13", role: "customer", text: "This is unacceptable. I will file a complaint.", translated: "这不可接受，我要投诉。", time: "11:52", sourceLanguage: "English", targetLanguage: "中文", translationProvider: "AI 翻译", translationStatus: "ready", sentiment: "angry", riskLevel: "high" },
  ],
}

export const quickTranslations: Record<string, { zh: string; en: string; es: string }> = {
  "退款已受理": { zh: "退款已受理。", en: "Your refund request has been accepted.", es: "Su solicitud de reembolso ha sido aceptada." },
  "预计 1-2 个工作日到账": { zh: "预计 1-2 个工作日到账。", en: "It is expected to arrive in 1-2 business days.", es: "Se espera que llegue en 1-2 días hábiles." },
  "正在帮您核实订单状态": { zh: "正在帮您核实订单状态。", en: "I am checking your order status.", es: "Estoy verificando el estado de su pedido." },
  "好的，我现在帮您确认。": { zh: "好的，我现在帮您确认。", en: "Got it, I will check it for you now.", es: "Entendido, lo verificaré ahora mismo." },
  "请稍等，我正在查询。": { zh: "请稍等，我正在查询。", en: "Please wait a moment, I am checking.", es: "Un momento, por favor. Estoy consultando." },
  "我已经转给专员处理了。": { zh: "我已经转给专员处理了。", en: "I have forwarded this to the specialist.", es: "He transferido este caso a un especialista." },
  "您好，已收到您的退款申请，当前订单正在财务复核，预计 1-2 个工作日到账。": {
    zh: "您好，已收到您的退款申请，当前订单正在财务复核，预计 1-2 个工作日到账。",
    en: "Hello, we have received your refund request. Your order is under financial review and the refund is expected within 1-2 business days.",
    es: "Hola, hemos recibido su solicitud de reembolso. El pedido está en revisión financiera y se espera el reembolso en 1-2 días hábiles.",
  },
  "请提供订单号，我马上为您查询最新状态。": {
    zh: "请提供订单号，我马上为您查询最新状态。",
    en: "Please provide your order number and I will check the latest status right away.",
    es: "Facilítenos el número de pedido y consultaré el estado más reciente de inmediato.",
  },
}

export const quickReplies = [
  { id: "q1", title: "退款受理", shortcut: "/refund", category: "售后", scope: "团队", variables: ["{order_no}"], zh: "您好，已收到您的退款申请，当前订单正在财务复核，预计 1-2 个工作日到账。", en: "Hello, we have received your refund request. Your order is under financial review and the refund is expected within 1-2 business days.", es: "Hola, hemos recibido su solicitud de reembolso. El pedido está en revisión financiera y se espera el reembolso en 1-2 días hábiles." },
  { id: "q2", title: "查询订单", shortcut: "/order", category: "通用", scope: "个人", variables: ["{order_no}"], zh: "请提供订单号，我马上为您查询最新状态。", en: "Please provide your order number and I will check the latest status right away.", es: "Facilítenos el número de pedido y consultaré el estado más reciente de inmediato." },
  { id: "q3", title: "稍等核实", shortcut: "/wait", category: "通用", scope: "个人", variables: [], zh: "请稍等，我正在为您核实。", en: "Please wait a moment while I verify this for you.", es: "Un momento, por favor. Estoy verificándolo para usted." },
  { id: "q4", title: "转专员", shortcut: "/escalate", category: "协作", scope: "租户", variables: [], zh: "我已经将您的问题转给专员处理，稍后会主动联系您。", en: "I have forwarded your issue to a specialist, who will contact you shortly.", es: "He transferido su problema a un especialista, que se pondrá en contacto con usted en breve." },
  { id: "q5", title: "致歉安抚", shortcut: "/sorry", category: "安抚", scope: "团队", variables: [], zh: "非常抱歉给您带来不便，我们会优先处理您的问题。", en: "I am very sorry for the inconvenience. We will prioritize your issue.", es: "Lamento mucho las molestias. Priorizaremos su problema." },
  { id: "q6", title: "VIP 优先", shortcut: "/vip", category: "会员", scope: "租户", variables: ["{customer_name}"], zh: "已为您升级为优先处理，请您放心。", en: "Your case has been prioritized. Please rest assured.", es: "Su caso ha sido priorizado. Puede estar tranquilo." },
]

export type AiSuggestion = {
  id: string
  conversationId: string
  agentText: string
  customerText: string
  confidence: number
  sources: string[]
  tone: SuggestionTone
  round: number
  riskNote?: string
}

type SuggestionSeed = {
  zh: string
  en: string
  es: string
  confidence: number
  sources: string[]
  riskNote?: string
}

const suggestionSeeds: Record<string, SuggestionSeed[]> = {
  c1: [
    { zh: "退款正在财务复核中，预计 1-2 个工作日到账。我会继续跟进，到账后第一时间通知您。", en: "Your refund is under financial review and should arrive in 1-2 business days. I will keep following up and notify you as soon as it is processed.", es: "El reembolso está en revisión financiera y debería llegar en 1-2 días hábiles. Seguiré el caso y le avisaré en cuanto se procese.", confidence: 0.86, sources: ["退款多久到账？", "Refund policy"] },
    { zh: "我已为您的订单加急处理，正在确认具体到账时间。", en: "I have prioritized your order and am confirming the exact arrival time.", es: "He priorizado su pedido y estoy confirmando la fecha exacta de llegada.", confidence: 0.78, sources: ["退款多久到账？"] },
    { zh: "非常抱歉让您久等。我会在 30 分钟内再次核实退款进度并回复您。", en: "I am sorry for the wait. I will verify the refund progress again within 30 minutes and get back to you.", es: "Lamento la espera. Verificaré nuevamente el progreso del reembolso en 30 minutos y le responderé.", confidence: 0.72, sources: ["售后政策库"] },
    { zh: "请问您方便提供一下订单号吗？我马上为您查询退款状态。", en: "Could you please provide your order number? I will check the refund status right away.", es: "¿Podría proporcionarme el número de pedido? Consultaré el estado del reembolso de inmediato.", confidence: 0.69, sources: ["订单查询工具"] },
  ],
  c2: [
    { zh: "很高兴帮到您。如后续还有问题，随时联系我们。", en: "Glad I could help. If you need anything else, feel free to reach out.", es: "Me alegra haber podido ayudar. Si necesita algo más, no dude en contactarnos.", confidence: 0.91, sources: ["会员权益表"] },
    { zh: "您的会员权益已生效，可在账户中心查看。", en: "Your membership benefits are now active. You can view them in your account center.", es: "Sus beneficios de membresía ya están activos. Puede verlos en el centro de su cuenta.", confidence: 0.88, sources: ["会员权益表"] },
    { zh: "我会把这次处理结果记录到您的服务历史中。", en: "I will record this resolution in your service history.", es: "Registraré esta resolución en su historial de servicio.", confidence: 0.76, sources: ["历史会话"] },
  ],
  c3: [
    { zh: "非常理解您的着急。账号安全团队已接手，会在 30 分钟内联系您。", en: "I understand your urgency. Our account security team has taken over and will contact you within 30 minutes.", es: "Entiendo su urgencia. Nuestro equipo de seguridad de cuentas se ha hecho cargo y le contactará en 30 minutos.", confidence: 0.82, sources: ["账号安全流程"], riskNote: "涉及账号安全，发送前需人工复核。" },
    { zh: "为保护您的账户，请先不要重复尝试登录。我们可以协助您完成身份验证。", en: "To protect your account, please avoid repeated login attempts. We can help you complete identity verification.", es: "Para proteger su cuenta, evite intentos de inicio de sesión repetidos. Podemos ayudarle a completar la verificación de identidad.", confidence: 0.77, sources: ["账号安全流程"], riskNote: "涉及账号安全，发送前需人工复核。" },
    { zh: "请问您最近是否在陌生设备上登录过？这有助于我们快速定位问题。", en: "Have you logged in from an unfamiliar device recently? This will help us locate the issue faster.", es: "¿Ha iniciado sesión recientemente desde un dispositivo desconocido? Esto nos ayudará a localizar el problema más rápido.", confidence: 0.74, sources: ["安全问卷"], riskNote: "涉及账号安全，发送前需人工复核。" },
    { zh: "我已将您的会话标记为高风险，并通知团队负责人跟进。", en: "I have marked your conversation as high risk and notified the team lead.", es: "He marcado su conversación como de alto riesgo y he notificado al responsable del equipo.", confidence: 0.71, sources: ["风险策略"], riskNote: "涉及投诉风险，发送前需人工复核。" },
  ],
}

const tonePrefix: Record<SuggestionTone, string> = {
  正式: "",
  友好: "您好，",
  简洁: "",
  安抚: "非常理解您的心情。",
}

const toneSuffix: Record<SuggestionTone, string> = {
  正式: "",
  友好: "感谢您的耐心等待。",
  简洁: "",
  安抚: "请您放心，我会持续跟进。",
}

function firstSentence(text: string) {
  const match = text.match(/^[^。！？.!?]+[。！？.!?]?/)
  return match?.[0] ?? text
}

export function getAiSuggestions(conversation: ChatConversation, tone: SuggestionTone, round: number): AiSuggestion[] {
  const seeds = suggestionSeeds[conversation.id] ?? suggestionSeeds.c1
  const rotated = seeds.map((_, index) => seeds[(index + round) % seeds.length])

  return rotated.map((seed, index) => {
    const isShort = tone === "简洁"
    const agentBase = isShort ? firstSentence(seed.zh) : seed.zh
    const customerBase = isShort ? firstSentence(seed[conversation.language === "es" ? "es" : "en"]) : seed[conversation.language === "es" ? "es" : "en"]
    const agentText = `${tonePrefix[tone]}${agentBase}${toneSuffix[tone]}`.trim()
    const customerText = `${tonePrefix[tone] ? (conversation.language === "es" ? "Hola, " : "Hi, ") : ""}${customerBase}${toneSuffix[tone] ? (conversation.language === "es" ? " Gracias por su paciencia." : " Thank you for your patience.") : ""}`.trim()

    return {
      id: `s_${conversation.id}_${tone}_${round}_${index}`,
      conversationId: conversation.id,
      agentText,
      customerText,
      confidence: Math.max(0.56, seed.confidence - round * 0.02),
      sources: seed.sources,
      tone,
      round,
      riskNote: conversation.riskLevel === "high" ? "高风险会话：AI 建议仅供参考，发送前必须人工确认。" : seed.riskNote,
    }
  })
}

export type DraftTranslation = {
  text: string | null
  status: "ready" | "failed"
  provider: string
}

export function translateDraft(text: string, target: CustomerLanguage): DraftTranslation {
  const value = text.trim()
  if (!value) return { text: "", status: "ready", provider: "AI 翻译" }
  if (target === "zh") return { text: value, status: "ready", provider: "原文" }

  const exact = quickTranslations[value]
  if (exact) return { text: exact[target], status: "ready", provider: "AI 翻译" }

  let translated = value
  let matched = false
  const entries = Object.entries(quickTranslations).sort((a, b) => b[0].length - a[0].length)
  for (const [source, targetText] of entries) {
    if (translated.includes(source)) {
      translated = translated.split(source).join(targetText[target])
      matched = true
    }
  }

  if (matched) return { text: translated, status: "ready", provider: "AI 翻译" }
  return { text: null, status: "failed", provider: "AI 翻译" }
}

export const sentimentLabels: Record<Sentiment, { label: string; tone: "destructive" | "outline" | "secondary" }> = {
  positive: { label: "积极", tone: "secondary" },
  neutral: { label: "平稳", tone: "outline" },
  negative: { label: "不满", tone: "outline" },
  angry: { label: "愤怒", tone: "destructive" },
}

export const riskLabels: Record<RiskLevel, { label: string; tone: "destructive" | "outline" | "secondary" }> = {
  low: { label: "低风险", tone: "secondary" },
  medium: { label: "中风险", tone: "outline" },
  high: { label: "高风险", tone: "destructive" },
}
