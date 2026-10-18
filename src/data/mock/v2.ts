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
  { id: "d1", baseId: "kb1", title: "春节发货时间", type: "FAQ", language: "中文", status: "已发布", answer: "春节期间只发货预付订单，2 月 8 日恢复全部发货。", hits: 186 },
  { id: "d2", baseId: "kb1", title: "商品优惠叠加规则", type: "规则", language: "中文", status: "已发布", answer: "限时折扣与优惠券可叠加，会员折不可叠加。", hits: 92 },
  { id: "d3", baseId: "kb2", title: "退款多久到账？", type: "FAQ", language: "中文", status: "已发布", answer: "原路退回，1-2 个工作日到账。", hits: 268 },
  { id: "d4", baseId: "kb2", title: "退货流程", type: "模板", language: "中文", status: "已发布", answer: "请提供订单号和商品照片，审核通过后生成退货码。", hits: 141 },
  { id: "d5", baseId: "kb3", title: "会员权益表", type: "规则", language: "中文", status: "待审核", answer: "普通会员 95 折，黑卡会员 88 折。", hits: 34 },
  { id: "d6", baseId: "kb3", title: "会员券包使用", type: "FAQ", language: "中文", status: "草稿", answer: "券包每月 1 日刷新，过期券不可补发。", hits: 0 },
  { id: "d7", baseId: "kb4", title: "Refund policy", type: "政策", language: "English", status: "已发布", answer: "Refunds return to the original payment method within 1-2 business days.", hits: 121 },
  { id: "d8", baseId: "kb4", title: "Política de reembolso", type: "政策", language: "Español", status: "已发布", answer: "El reembolso llega en 1-2 días hábiles.", hits: 78 },
]

export type V2ConversationStatus = "waiting" | "ai" | "human"

export const v2Conversations = [
  { id: "c1", name: "Maya", app: "WhatsApp", preview: "How long will it take?", time: "12:34", unreadCount: 2, status: "waiting" as V2ConversationStatus },
  { id: "c2", name: "Lucía", app: "Telegram", preview: "Gracias por la ayuda.", time: "12:20", unreadCount: 0, status: "ai" as V2ConversationStatus },
  { id: "c3", name: "Daniel", app: "Messenger", preview: "My account is locked.", time: "11:52", unreadCount: 1, status: "human" as V2ConversationStatus },
]

export const v2Messages = [
  { id: "m1", role: "customer" as const, text: "Hello, I need a refund for my order.", translated: "你好，我想申请订单退款。", time: "12:31" },
  { id: "m2", role: "agent" as const, text: "I have confirmed the refund status for you.", translated: "我已经帮你确认退款状态。", time: "12:32" },
  { id: "m3", role: "customer" as const, text: "How long will it take?", translated: "还需要等多久？", time: "12:34" },
]

export const v2QuickTranslations: Record<string, { zh: string; en: string }> = {
  "退款已受理": { zh: "Refund accepted.", en: "退款已受理。" },
  "预计 1-2 个工作日到账": { zh: "It is expected to arrive in 1-2 business days.", en: "预计 1-2 个工作日到账。" },
  "正在帮您核实订单状态": { zh: "I am checking your order status.", en: "正在帮您核实订单状态。" },
  "好的，我现在帮您确认。": { zh: "Got it, I will check it for you now.", en: "好的，我现在帮您确认。" },
  "请稍等，我正在查询。": { zh: "Please wait a moment, I am checking.", en: "请稍等，我正在查询。" },
  "我已经转给专员处理了。": { zh: "I have forwarded this to the specialist.", en: "我已经转给专员处理了。" },
}

export const v2QuickReplies = [
  { english: "Got it, I will check it for you now.", chinese: "好的，我现在帮您确认。" },
  { english: "Please wait a moment, I am checking.", chinese: "请稍等，我正在查询。" },
  { english: "I have forwarded this to the specialist.", chinese: "我已经转给专员处理了。" },
]

export const v2AiSuggestions = [
  { english: "The refund is under review and will arrive in 1-2 business days.", chinese: "退款正在复核中，预计 1-2 个工作日到账。" },
  { english: "I have expedited your case and will notify you once it is processed.", chinese: "我已为您的订单加急处理，完成后会通知您。" },
  { english: "Would you like me to send the refund progress screenshot?", chinese: "需要我把退款进度截图发给您吗？" },
]
