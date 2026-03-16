# Header 洗头机 — OpenAI 协议兼容版

一个部署在 Cloudflare Workers 上的请求头（Header）清洗检测工具。它伪装成一个 OpenAI 兼容的大模型接口，当你通过 NewAPI 等中转站向它发消息时，会直接在聊天框里返回一份 **Header 清洗前后对比报告**，帮你确认敏感信息是否已被正确清除。

## 它能做什么

1. **记录原始请求头** — 完整捕获中转站转发过来的所有 Header
2. **模拟清洗** — 删除以下敏感 Header：
   - Cloudflare 注入的：`cf-connecting-ip`、`cf-ipcountry`、`cf-ray`、`cf-visitor`、`cf-worker`
   - 代理/转发相关：`x-forwarded-for`、`x-real-ip`
   - 来源信息：`referer`、`origin`
   - 中转站特征：`x-title`、`x-oneapi-request-id`、`new-api-user`
   - 其他：`cookie`，以及所有 `x-` 开头的自定义 Header
3. **伪装 User-Agent** — 替换为常见浏览器 UA
4. **以 Markdown 格式输出对比报告** — 直接在聊天界面中查看结果

## 部署

### 前置要求

- 一个 [Cloudflare](https://www.cloudflare.com/) 账号

### 步骤

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**
2. 点击 **Create**（创建），选择 **Create Worker**
3. 将 `header-washer.js` 中的代码粘贴到在线编辑器中
4. 点击 **Deploy**（部署）
5. 记下分配的 Worker URL（形如 `https://xxx.your-name.workers.dev`）

## 使用方法

将 Worker URL 作为一个 OpenAI 兼容的 API 地址，添加到你的中转站（NewAPI / OneAPI 等）中：

- **API 地址**：`https://your-worker.workers.dev/v1`（或不带 `/v1`，均可）
- **模型名称**：随意填写，Worker 不校验
- **API Key**：随意填写，Worker 不校验

然后在聊天界面中向这个"模型"发送任意消息，它会回复一份如下格式的检测报告：

```
### 🕵️ Header 洗头机检测报告

**原始请求头 (NewAPI 发来的)**:
{ ... }

**清洗后发给中转站的**:
{ ... }
```

对比两组 Header，即可确认你的中转站是否泄露了 IP、来源等敏感信息。

## 协议兼容性

- 完整兼容 OpenAI `/v1/chat/completions` 接口格式
- 同时支持 **流式（SSE）** 和 **非流式（JSON）** 两种响应模式
- 内置 CORS 支持，可直接从浏览器端调用

## 许可证

MIT
