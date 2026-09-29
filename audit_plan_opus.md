# pRash Hub — Project Audit & Remediation Plan

_Project:_ **pRash Hub** — a Next.js 14 (App Router) personal AI chat hub with 22 role-based "agents", multi-provider streaming (OpenAI → Gemini → Groq → NVIDIA), password gate, and localStorage-only history.
_Audited:_ full `src/` tree, configs, build pipeline. Static analysis + live `tsc --noEmit` + `next build`.

---

## 1. Executive Summary

The app **compiles and builds cleanly** (`tsc` and `next build` both pass, ~197 kB first load, one dynamic edge API route). Type discipline is good, the markdown pipeline is XSS-safe (`react-markdown`, no `dangerouslySetInnerHTML`), and health/legal agents carry disclaimers.

However, the audit found a **critical cluster of security holes** that make the app unsafe to expose publicly, plus a handful of **functional gaps where the product promises more than it delivers**. The headline problem: **the chat endpoint is completely unauthenticated and the "login" is decorative**, so anyone who can reach the deployment can spend against your paid API keys.

Severity buckets: **5 Critical**, **4 High**, **5 Medium**, **10 Low** (details below).

---

## 2. How to read this plan

- Findings are ranked **Critical → Low** with exact file:line evidence.
- Section 6 turns findings into a **phased roadmap** ordered by risk-reduction-per-effort.
- Section 7 lists **quick wins** (≤1 line each) you can ship today.
- Effort tags: **S** <1h, **M** half-day, **L** multi-day.

---

## 3. Build / health verification (evidence)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean, no errors |
| `npm run build` (Next 14.2.35) | ✅ compiled, 5 routes, edge API |
| `package-lock.json` committed | ❌ absent (non-reproducible installs) |
| `node_modules` / build artifacts in repo | ❌ absent (cleaned after audit) |
| Committed secrets | ✅ none (`.env.example` placeholders only; `.gitignore` covers `.env*`) |

> The green build matters: **every issue below is a runtime / logic / security defect, not a compile break.** Fixing them will not be caught by the compiler, so they need tests and manual runtime checks.

---

## 4. Findings

### 🔴 CRITICAL — Security

**C1 — `/api/chat` has zero authentication** (`src/app/api/chat/route.ts:12`)
The POST handler validates only `messages` and `agentId` (line 17). It never checks the bearer token from `/api/auth`. Because the API keys live server-side, **any unauthenticated caller can POST `/api/chat` and drive your OpenAI/Gemini/Groq/NVIDIA spend.** The client-side login screen provides no real protection. _Fix: verify token/session server-side at the top of the handler and return `401` early. (Effort M)_

**C2 — Auth token is forgeable and "validation" accepts anything** (`src/app/api/auth/route.ts:9,28`)
- Token = `base64(Date.now() + Math.random())` — unsigned, unguessable only by luck, no server store, no expiry.
- `GET` returns `{ valid:true }` for **any** non-empty token (`if (token && token.trim() !== ''`, line 28) — it validates nothing.
_Fix: issue a signed token (e.g., JWE/HMAC or an opaque id in a server/session store), validate the signature on every protected route, add expiry + revocation. (Effort M–L)_

**C3 — Hard-coded default password `prash2024`** (`src/app/api/auth/route.ts:6`)
`process.env.APP_PASSWORD || 'prash2024'` fails **open**: if the env var is missing, a publicly-known password is live. This repo being public means the secret is known. _Fix: fail **closed** — if `APP_PASSWORD` is unset, refuse authentication (500) rather than defaulting. (Effort S)_

**C4 — No rate limiting / abuse or spend controls** (all API routes)
Nothing throttles requests, caps body size, or caps tokens/cost per caller. Combined with C1, the deployment is an **open proxy to your payment methods**. _Fix: add per-IP rate limiting (e.g., `@upstash/ratelimit` + Vercel KV, or middleware), a max request body size, and an optional per-day request/spend budget. (Effort M)_

**C5 — No security headers / CSP** (`next.config.mjs`)
No `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. An app that renders untrusted LLM markdown, handles an auth token, and calls third-party APIs should ship a baseline header set. _Fix: add an async `headers()` block in `next.config.mjs`. (Effort S)_

### 🟠 HIGH — Functional correctness / trust

**H1 — Non-image attachments are silently dropped** (`src/app/api/chat/route.ts:36`)
Only `image/*` files are sent to the model. PDFs, DOCX, CSV, XLSX and TXT are reduced to a filename string (`[Attached file: name]`) and their **content is never transmitted** — even though ~10 agents explicitly advertise "analyze uploaded CSV/resume/report/document." The feature works for images only, and fails **silently** (no error surfaced). _Fix: for text/csv/txt, inline the decoded content; for PDF/DOCX, extract text server-side (or rely on provider file APIs). At minimum, warn the user when an unsupported file type is attached. (Effort L)_

**H2 — Vision/fallback mismatch** (`src/app/api/chat/route.ts` + `src/lib/models.ts`)
`supportsVision` is declared per model but **never used**. If an image-bearing message falls through to Groq/NVIDIA (`supportsVision:false`), the image part is still sent → provider error → likely `503 All models failed`. _Fix: when a message contains images, skip non-vision models; if none remain, return a clear "no vision model configured" message. (Effort S–M)_

**H3 — Mid-stream errors are swallowed** (`src/app/api/chat/route.ts:66-79`)
The `ReadableStream.start()` catches stream errors, logs them, then calls `controller.close()`. The user sees a **quietly truncated** answer with no error state and no retry/fallback. _Fix: propagate a structured error into the stream (or emit an SSE error event) so the client can surface it; fall back only before the first token. (Effort M)_

**H4 — Single shared password, no user identity** (`auth`/`ChatApp.tsx`)
By design (personal tool): one password, client-only "auth", token in localStorage. There is **no per-user scoping and no way to revoke access** other than rotating the password. _Fix: acknowledge the single-user model explicitly in docs; if ever multi-user, move to real auth. (Effort S, docs)_

### 🟡 MEDIUM — Robustness / cost / UX

**M1 — Entire history re-sent every turn** (`src/hooks/useChat.ts:65`)
`messages.map(...)` posts the whole conversation (including re-uploaded base64 attachments) each request. No windowing/truncation → unbounded token/cost growth and eventual context-length failures on long chats. _Fix: cap to the last N messages (or a token budget) before sending; don't re-send stale attachments. (Effort M)_

**M2 — localStorage base64 quota + unguarded file size** (`src/lib/storage.ts:7-15`, `src/components/ChatInput.tsx:46-63`)
Attachments (base64 data URLs) + full history live in `localStorage` (~5 MB). Large/multiple files blow the quota; `saveChats` **swallows** the `QuotaExceededError`, so chats silently stop persisting. `deploy.md` claims a "~10 MB max per file," but **`ChatInput` enforces no size limit at all.** `crypto.randomUUID()` also throws on non-secure contexts. _Fix: enforce a client file-size/count limit, cap per-message attachment size, and surface persistence failures to the user. (Effort S)_

**M3 — No server-side request/size guard**
Reinforces M1/M4. Add a max body-size check on `/api/chat` and strip oversized attachments. (Effort S)

**M4 — Dark/light mode is half-implemented and broken** (`layout.tsx:18`, `ChatApp.tsx`, `Sidebar.tsx`, `globals.css`)
`<html class="dark">` is hardcoded, and key surfaces hardcode dark-only classes (`bg-gray-950 text-white`, shell `bg-gray-950 text-gray-100`). Toggling "Dark Mode" off leaves many dark screens — the toggle does not reliably produce light mode. _Fix: drive the root class from state/localStorage on mount, and replace hardcoded dark surfaces with `dark:`-prefixed pairs (remove dead light-mode classes or complete them). (Effort M)_

**M5 — Model defaults will drift / retire silently** (`src/lib/models.ts`)
Pinned defaults (`gemini-2.0-flash`, `gpt-4o-mini`, `llama-3.3-70b-versatile`, `meta/llama-3.1-70b-instruct`) and the `ai` SDK `^` ranges will age; failures only surface as runtime `503`. _Fix: document a "rotate models" runbook (deploy.md has a stub), and optionally add a startup/config sanity check. (Effort S)_

### 🟢 LOW — Quality / maintainability

**L1 — No `README.md`.** `deploy.md` is deployment-only and partly inaccurate (Cloudflare "edge function" caveat; the "~10 MB file cap" that isn't enforced). → Add a real README (what it is, architecture, env, model chain). (S)
**L2 — No tests and no CI.** Nothing guards the auth fix or the streaming fallback. → Add unit tests for `getModelChain`, `storage`, and API auth; plus a smoke test. (M)
**L3 — No committed `package-lock.json`; no `.nvmrc`/`engines`.** Non-reproducible builds, no audit baseline. → Commit a lockfile, add `.nvmrc` (Node 20-ish) and `engines`. (S)
**L4 — Bare `console.*` in production paths** (`chat/route.ts`, `storage.ts`). → Structured logging + request id; don't log user content. (S)
**L5 — Global `* { transition }`** (`globals.css:12`) — performance smell; transitions animate every element including scroll. → Scope to interactive elements. (S)
**L6 — Bogus `X-Content-Type` header** (`chat/route.ts:85`); stream returned as `text/plain`. Confusing for a stream. → Use proper `text/event-stream` framing or drop the header. (S)
**L7 — Dead export `getAgentsByCategory`** (`agents.ts:513`) and loose `^` dependency ranges. → Remove dead code, pin majors. (S)
**L8 — Category label mismatch:** "Daily Life" agents use category `creative` in data. Confusing for future filtering. → Add a `dailyLife` category or fix the label. (S)
**L9 — Cross-component state via `window` events** (`ChatApp.tsx:47-59` logout/clearChats). Brittle. → Centralize state (context/store). (M)
**L10 — `crypto.randomUUID()` for ids** (`useChat.ts:38`, `ChatInput.tsx:53`, `auth`). Fails on insecure origins. → Add a UUID fallback. (S)

---

## 5. What's already good (keep it)

- `tsc` + `next build` are green; strict TS on.
- Markdown rendering is XSS-safe (`react-markdown` + `remark-gfm` + `rehype-highlight`, no `dangerouslySetInnerHTML`); links get `rel="noopener noreferrer"`.
- **Privacy Mode genuinely restricts the chain to Google** (`getModelChain`), and medical/legal agents carry explicit disclaimers with crisis hotlines.
- No committed secrets; `.env.example` uses placeholders; `.gitignore` covers `.env*`.
- Clean separation: `lib/` (agents, models, storage, types) vs `components/` vs API routes.

---

## 6. Phased remediation roadmap

Ordered by risk-reduction-per-effort. Each phase is independently shippable.

**Phase 0 — Stop the bleeding (security, ~half-day)** _(C1, C3, C4, C5, C2)_
1. Fail closed when `APP_PASSWORD` is unset (remove `'prash2024'` default).
2. Protect `/api/chat`: require a valid signed token; `401` otherwise. Add the same middleware for any future routes.
3. Replace forgeable token with a **signed** token (HMAC/JWE) validated server-side; add expiry + logout revocation. (Interim: an opaque random id kept server-side is acceptable for a single-user app.)
4. Add security headers + a baseline CSP via `next.config.mjs`.
5. Add per-IP rate limiting + a max request/body size on `/api/chat`.
_Done when:_ an unauthenticated `curl` to `/api/chat` gets `401`; missing `APP_PASSWORD` blocks login; basic headers present.

**Phase 1 — Correctness & trust (High, ~1–2 days)** _(H1, H2, H3)_
1. Enforce/support attachment types: inline text/CSV/TXT; extract PDF/DOCX server-side or warn clearly when unsupported. Stop lying to users about "analyze this file."
2. Use `supportsVision` to skip non-vision fallbacks for image messages; return a clear error if no vision model is available.
3. Stop swallowing mid-stream errors — surface a structured error to the client and fall back only before the first token.
_Done when:_ uploading a CSV yields a real summary; an image + no vision model gives a clear message; a mid-stream failure shows an error in the UI.

**Phase 2 — Cost & robustness (Medium, ~1 day)** _(M1, M2, M3, M4, M5)_
1. Window/truncate history in `useChat` (last N messages / token budget); stop re-sending old attachments.
2. Enforce client + server file-size/count limits; surface localStorage-quota failures instead of swallowing them; UUID fallback (L10).
3. Fix dark/light mode so the toggle actually works (drive root class from state, remove hardcoded dark-only surfaces).
4. Add a model-rotation runbook; remove stale defaults/`^` drift risk.
_Done when:_ long chats don't error on context length; oversized files are blocked with a message; light mode renders correctly.

**Phase 3 — Maintainability (Low, ongoing)** _(L1–L9)_
1. Write a real `README.md`; correct `deploy.md` inaccuracies.
2. Commit `package-lock.json`, add `.nvmrc`/`engines`; pin dependency majors.
3. Add CI: `tsc --noEmit`, `next build`, and tests (Vitest) for `getModelChain`, `storage`, and the auth guard.
4. Structured logging; scope CSS transitions; clean up dead code/categories/window-event plumbing.
_Done when:_ CI is green on PRs and the repo is reproducible from the lockfile.

---

## 7. Quick wins (ship today, ≤ a few minutes each)

| # | Change | File |
|---|--------|------|
| 1 | Remove `'prash2024'` fallback → fail closed if `APP_PASSWORD` unset | `api/auth/route.ts:6` |
| 2 | Add `Content-Security-Policy` + core security headers | `next.config.mjs` |
| 3 | Reject `/api/chat` calls with no/invalid token (`401`) | `api/chat/route.ts:12` |
| 4 | Skip non-vision fallbacks when images are present (use existing `supportsVision`) | `api/chat/route.ts` |
| 5 | Add a max file-size + count guard before accepting attachments | `ChatInput.tsx:46` |
| 6 | Fix the misleading `X-Content-Type` stream header | `api/chat/route.ts:85` |
| 7 | Commit `package-lock.json` + add `.nvmrc` | repo root |
| 8 | Add a `README.md` covering architecture + env + model chain | repo root |

---

## 8. Suggested acceptance criteria for "audit closed"

- [ ] Unauthenticated requests to `/api/chat` are rejected (`401`) — no anonymous key usage.
- [ ] Login cannot succeed without a real `APP_PASSWORD`; token is signed and server-verified.
- [ ] Rate limiting + max body size active on the API.
- [ ] Security headers/CSP present; no XSS in rendered markdown.
- [ ] File attachments behave as advertised, or clearly tell the user what's unsupported.
- [ ] Streaming failures surface an error to the user (no silent truncation).
- [ ] History is windowed; long chats don't fail on context length.
- [ ] Dark/light toggle works; oversized files blocked with feedback.
- [ ] `README`, lockfile, `.nvmrc`, CI (`tsc` + build + tests) all in place.

---

## Appendix — Threat model snapshot

| Asset | Exposure | Mitigated by |
|-------|----------|--------------|
| Paid API keys (OpenAI/Gemini/Groq/NVIDIA) | **Open** — `/api/chat` unauthenticated (C1) | Phase 0 |
| APP_PASSWORD | **Known default** `prash2024` (C3) | Phase 0 |
| Session token | **Forgeable / never validated** (C2) | Phase 0 |
| User chat history (PII in localStorage) | Local only; sent to providers each turn | Privacy Mode helps; Phase 1 M1 |
| Rendered LLM output | Safe (react-markdown), but no CSP | Phase 0 C5 |
