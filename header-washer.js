/**
 * OpenAI 协议兼容版 Header 洗头测试机
 * 作用：不仅能洗头，还能把自己伪装成一个大模型，在聊天框里把结果回复给你。
 */
export default {
  async fetch(request, env, ctx) {
    // 仅仅处理 OPTIONS 预检请求 (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }

    // 1. 照镜子：记录原始 Header
    const originalHeadersObj = {};
    for (const [key, value] of request.headers.entries()) {
      originalHeadersObj[key] = value;
    }

    // 2. 进洗头房：清洗特征
    const cleanedHeaders = new Headers(request.headers);
    const sensitiveHeaders = [
      'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker', 
      'x-forwarded-for', 'x-real-ip', 'referer', 'origin', 'x-title',
      'x-oneapi-request-id', 'new-api-user', 'cookie'
    ];
    sensitiveHeaders.forEach(headerName => cleanedHeaders.delete(headerName));

    const keysToDelete = [];
    for (const [key, value] of cleanedHeaders.entries()) {
        if (key.toLowerCase().startsWith('x-')) keysToDelete.push(key); 
    }
    keysToDelete.forEach(key => cleanedHeaders.delete(key));

    // 3. 伪装
    cleanedHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36');
    const cleanedHeadersObj = {};
    for (const [key, value] of cleanedHeaders.entries()) {
      cleanedHeadersObj[key] = value;
    }

    // ==========================================
    // 核心改造：伪装成 OpenAI 大模型回复
    // ==========================================

    // 构建我们要回复给你的文本内容 (Markdown 格式)
    const replyContent = `
### 🕵️ Header 洗头机检测报告

**原始请求头 (NewAPI 发来的)**:
\`\`\`json
${JSON.stringify(originalHeadersObj, null, 2)}
\`\`\`

**清洗后发给中转站的**:
\`\`\`json
${JSON.stringify(cleanedHeadersObj, null, 2)}
\`\`\`
    `;

    // 判断前端是不是要求流式输出 (Stream)
    let isStream = false;
    try {
      if (request.method === "POST") {
        const bodyText = await request.clone().text();
        if (bodyText) {
          const bodyJson = JSON.parse(bodyText);
          if (bodyJson.stream) isStream = true;
        }
      }
    } catch (e) { /* 解析失败就不当做流 */ }

    // 如果是流式请求，我们就用 SSE 协议，一坨一坨地吐给 NewAPI
    if (isStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // 构造一个 OpenAI 格式的 chunk
          const chunk = {
            id: "chatcmpl-header-wash",
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "header-tester",
            choices: [{
              index: 0,
              delta: { content: replyContent }, // 直接把全部内容作为一个 chunk 发送，省事
              finish_reason: null
            }]
          };
          // 发送数据块
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          
          // 发送结束标志
          const doneChunk = {
            id: "chatcmpl-header-wash",
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "header-tester",
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } 
    
    // 如果不是流式请求（普通 POST 或 GET），返回普通的 OpenAI JSON
    else {
      const responseJson = {
        id: "chatcmpl-header-wash",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "header-tester",
        choices: [{
          index: 0,
          message: { role: "assistant", content: replyContent },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };

      return new Response(JSON.stringify(responseJson), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
  }
};
