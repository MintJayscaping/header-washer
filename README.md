# header-washer
一个部署在 Cloudflare Workers 上的请求头（Header）清洗检测工具。它伪装成一个 OpenAI 兼容的大模型接口，当你通过 NewAPI 等中转站向它发消息时，会直接在聊天框里返回一份 **Header 清洗前后对比报告**，帮你确认敏感信息是否已被正确清除。
