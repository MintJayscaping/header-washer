# Header 洗头机 — OpenAI 协议兼容版

[English](readme_en.md)

一个部署在 Cloudflare Workers 上的请求头（Header）清洗**检测工具**。它伪装成一个 OpenAI 兼容的大模型接口，当你通过 NewAPI 等中转站向它发消息时，会直接在聊天框里返回一份 **Header 清洗前后对比报告**，帮你确认敏感信息是否已被正确清除。

> **本仓库仅提供检测/诊断工具，不提供用于生产环境的请求头清理 Worker。**

## 设计初衷

- **保护用户隐私。** 部分前端应用（如 NewAPI 等）会在请求中自行附加额外的请求头（如用户 IP、来源标识等），而用户可能并不知情，也不希望这些信息被中转站或上游 API 提供商看到。
- **让用户看清前端到底发了什么。** 本工具帮助你看清前端软件在请求中附加了哪些 Header，从而有针对性地进行清理。

## 它能做什么

1. **记录原始请求头** — 完整捕获前端发送过来的所有 Header
2. **清洗请求头** — 使用与生产环境相同的代码模式（构建清洗后的 Headers → 组装新的 Request 对象），删除以下敏感 Header：
   - Cloudflare 注入的：`cf-connecting-ip`、`cf-ipcountry`、`cf-ray`、`cf-visitor`、`cf-worker`
   - 代理/转发相关：`x-forwarded-for`、`x-real-ip`
   - 来源信息：`referer`、`origin`
   - 中转站特征：`x-title`、`x-oneapi-request-id`、`new-api-user`
   - 其他：`cookie`，以及所有 `x-` 开头的自定义 Header
3. **回显对比报告** — 从清洗后的 Request 对象中读取 Header，与原始 Header 并排展示

> 脚本使用的清洗逻辑与生产环境完全一致，唯一的区别是最后一步：脚本不会将清洗后的请求 `fetch()` 到任何上游服务器，而是把清洗前后的 Header 作为对比报告返回给你。如果你要编写自己的生产级清理 Worker，只需在此基础上加一步 `fetch()` 转发逻辑即可。
>
> 由于没有配置上游地址，**使用本脚本不会产生任何 API 调用费用**（唯一的消耗是 Cloudflare Workers 的免费请求额度）。

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

- **API 地址**：`https://your-worker.workers.dev/v1`（或不带 `/v1`，依据自身情况）
- **模型名称**：随意填写，Worker 不校验
- **API Key**：随意填写，Worker 不校验

然后在聊天界面中向这个"模型"发送任意消息，它会回复一份如下格式的检测报告：

```
### Header 洗头机检测报告

**原始请求头 (前端发来的)**:
{ ... }

**清洗后的请求头 (可用于转发)**:
{ ... }
```

对比两组 Header，即可确认前端是否附加了不必要的敏感信息（如真实IP）。

## 重要说明

- **本脚本是检测工具，不是生产方案。** 脚本中硬编码的清洗列表仅用于演示和对比展示，不代表最佳实践。你应当根据检测报告的结果，自己编写真正用于生产环境的 Worker。
- **清洗哪些 Header 完全取决于你自己的使用环境。** 不同的中转站、不同的上游 API 对 Header 的要求各不相同，请根据实际情况自行决定保留或移除哪些请求头。
- **推荐工作流程：**
  1. 部署本检测工具 → 查看前端软件发送了哪些 Header
  2. 根据报告，自行编写清理用的 Worker
  3. 将清理 Worker 部署为前端与中转站/上游 API 之间的中间层
- **关于 Cloudflare Workers 的局限性：** 如果你使用 Cloudflare Workers 作为清理中间层，请注意 Cloudflare 会**强制注入**一些自身的请求头（如 `cf-connecting-ip`、`cf-ipcountry`、`cf-ray`、`cf-visitor` 等），这些 Header 在 Worker 代码中**无法删除** — 它们是在 Worker 执行之后、请求到达源站之前由 Cloudflare 基础设施添加的。换言之，你的 Worker 可以清理前端附加的 Header，但无法阻止 Cloudflare 自身附加的 Header 到达下游。

## 协议兼容性

- 完整兼容 OpenAI `/v1/chat/completions` 接口格式
- 同时支持 **流式（SSE）** 和 **非流式（JSON）** 两种响应模式
- 内置 CORS 支持，可直接从浏览器端调用

## 免责声明

- 本仓库**仅提供请求头检测工具**，不提供、也不包含用于清理请求头的生产级脚本。
- 如果你自行编写了清理 Worker 并部署使用，请务必遵守相关网站/API 提供商的使用条款和服务政策。
- **因用户自行清理请求头而导致的任何后果（包括但不限于账号封禁、服务中断等），本项目不承担任何责任。** 本项目从未提供清理工具，因此也不对清理行为的后果负责。
- 本工具的设计初衷是帮助用户了解自身隐私暴露情况，请合理合法地使用。

## 许可证

MIT
