# Header Washer — OpenAI-Compatible Edition

[中文](README.md)

A Cloudflare Worker that acts as a request-header **inspection and diagnostic tool**. It disguises itself as an OpenAI-compatible LLM endpoint — when you send it a message through an API relay (NewAPI / OneAPI, etc.), it replies directly in the chat with a **before-and-after header comparison report**, so you can verify whether sensitive information has been properly stripped.

> **This repository only provides an inspection/diagnostic tool. It does NOT provide a production-ready header-cleaning Worker.**

## Design Philosophy

- **Protect user privacy.** Some frontend applications (e.g., NewAPI) silently attach extra headers to requests (such as user IP, origin identifiers, etc.) without the user's knowledge or consent. Users may not want this information to be visible to relay operators or upstream API providers.
- **Show users what their frontend is actually sending.** This tool lets you see exactly which headers your frontend application attaches to requests, so you can make informed decisions about what to clean up.

## What It Does

1. **Captures original headers** — logs every header sent by the frontend application
2. **Cleans request headers** — uses the same code pattern as a production worker (build cleaned Headers → assemble a new Request object). Removes sensitive headers including:
   - Cloudflare-injected: `cf-connecting-ip`, `cf-ipcountry`, `cf-ray`, `cf-visitor`, `cf-worker`
   - Proxy / forwarding: `x-forwarded-for`, `x-real-ip`
   - Origin info: `referer`, `origin`
   - Relay fingerprints: `x-title`, `x-oneapi-request-id`, `new-api-user`
   - Others: `cookie`, and all custom `x-*` headers
3. **Returns a comparison report** — reads headers from the cleaned Request object and displays them side-by-side with the originals

> The cleaning logic is identical to what you'd use in production. The only difference is the final step: instead of `fetch()`-ing the cleaned request to an upstream server, the script returns the before-and-after headers as a comparison report. To build your own production cleaning Worker, simply add `fetch()` forwarding logic on top of this.
>
> Since no upstream address is configured, **using this script incurs zero API costs** (the only consumption is your Cloudflare Workers free request quota).

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
### Header Washer Report

**Original headers (from the frontend)**:
{ ... }

**Cleaned headers (ready for forwarding)**:
{ ... }
```

Compare the two sets to see whether your frontend is attaching unnecessary sensitive information (eg.your real IP).

## Important Notes

- **This script is a diagnostic tool, not a production solution.** The hard-coded header list in the script is for demonstration and comparison purposes only — it does not represent best practices. You should write your own production Worker based on the inspection results.
- **Which headers to strip depends entirely on your own environment.** Different relays and upstream APIs have different requirements. Decide for yourself which headers to keep and which to remove.
- **Recommended workflow:**
  1. Deploy this inspection tool → see what headers your frontend is sending
  2. Based on the report, write your own cleaning Worker
  3. Deploy your cleaning Worker as a middleware between the frontend and the relay / upstream API
- **Cloudflare Workers limitation:** If you use Cloudflare Workers as your cleaning middleware, be aware that Cloudflare **forcibly injects** its own headers (e.g., `cf-connecting-ip`, `cf-ipcountry`, `cf-ray`, `cf-visitor`, etc.) that **cannot be removed** by your Worker code — they are added by Cloudflare's infrastructure after the Worker executes and before the request reaches the origin. In other words, your Worker can strip headers added by the frontend, but it cannot prevent Cloudflare's own headers from reaching the downstream server.

## Compatibility

- Fully compatible with the OpenAI `/v1/chat/completions` API format
- Supports both **streaming (SSE)** and **non-streaming (JSON)** response modes
- Built-in CORS support for direct browser access

## Disclaimer

- This repository **only provides a header inspection tool**. It does not provide, nor does it contain, any production-grade header-cleaning script.
- If you write and deploy your own cleaning Worker, you must comply with the terms of service and usage policies of the relevant websites and API providers.
- **The author assumes no responsibility for any consequences arising from users cleaning request headers on their own (including but not limited to account suspension, service termination, etc.).** This project has never provided a cleaning tool and therefore bears no liability for the outcomes of any cleaning actions.
- This tool is designed to help users understand their own privacy exposure. Please use it responsibly and in compliance with applicable rules.

## License

MIT
