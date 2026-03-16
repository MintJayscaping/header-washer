# Header Washer — OpenAI-Compatible Edition

[中文](README.md)

A Cloudflare Worker that acts as a request-header inspection and sanitization tool. It disguises itself as an OpenAI-compatible LLM endpoint — when you send it a message through an API relay (NewAPI / OneAPI, etc.), it replies directly in the chat with a **before-and-after header comparison report**, so you can verify whether sensitive information has been properly stripped.

## What It Does

1. **Captures original headers** — logs every header forwarded by the API relay
2. **Simulates sanitization** — removes sensitive headers including:
   - Cloudflare-injected: `cf-connecting-ip`, `cf-ipcountry`, `cf-ray`, `cf-visitor`, `cf-worker`
   - Proxy / forwarding: `x-forwarded-for`, `x-real-ip`
   - Origin info: `referer`, `origin`
   - Relay fingerprints: `x-title`, `x-oneapi-request-id`, `new-api-user`
   - Others: `cookie`, and all custom `x-*` headers
3. **Spoofs User-Agent** — replaces it with a common browser UA string
4. **Outputs a Markdown report** — viewable directly in any chat UI

## Deployment

### Prerequisites

- A [Cloudflare](https://www.cloudflare.com/) account

### Steps

1. Log in to the Cloudflare Dashboard and go to **Workers & Pages**
2. Click **Create** → **Create Worker**
3. Paste the contents of `header-washer.js` into the online editor
4. Click **Deploy**
5. Note the assigned Worker URL (e.g. `https://xxx.your-name.workers.dev`)

## Usage

Add the Worker URL as an OpenAI-compatible API base in your relay (NewAPI / OneAPI, etc.):

- **API Base URL**: `https://your-worker.workers.dev/v1` (with or without `/v1`)
- **Model name**: anything — the Worker doesn't validate it
- **API Key**: anything — the Worker doesn't validate it

Send any message to this "model" in the chat UI. It will reply with a report like:

```
### 🕵️ Header Washer Report

**Original headers (from the relay)**:
{ ... }

**Sanitized headers (what would be sent upstream)**:
{ ... }
```

Compare the two sets to confirm whether your relay leaks IP addresses, origin info, or other sensitive data.

## Compatibility

- Fully compatible with the OpenAI `/v1/chat/completions` API format
- Supports both **streaming (SSE)** and **non-streaming (JSON)** response modes
- Built-in CORS support for direct browser access

## License

MIT
