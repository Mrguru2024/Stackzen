# Phase 6 — AI Safety & Privacy Implementation Log

**Status:** Implemented  
**Date:** 2026-05-16  
**Depends on:** Phase 5 (`lib/security/redact.ts`, `lib/ai/chat-persistence.ts`)

## Schema (migration `20260516180000_ai_safety_privacy`)

**UserSettings:**

- `aiConsentAt` — user accepted AI terms
- `aiMemoryEnabled` — persist chat in `ChatMessage` (default `false`)
- `aiOptOut` — disables all AI features

**AiInteractionLog** — append-only audit (`ai.chat_completed`, `ai.prompt_blocked`, etc.)

## New modules

| Module | Purpose |
|--------|---------|
| `lib/ai/consent.ts` | `requireAiConsent`, `grantAiConsent`, `getAiPrivacySettings` |
| `lib/ai/prompt-guard.ts` | Injection + length + restricted-topic checks |
| `lib/ai/response-policy.ts` | Block directive/guarantee phrases; soften language |
| `lib/ai/memory.ts` | Memory gating, clear, interaction logging |
| `lib/ai/money-mentor-service.ts` | Shared chat/history handler |

## API routes

| Route | Behavior |
|-------|----------|
| `POST /api/ai/consent` | Grant consent (`aiConsentAt`) |
| `GET /api/ai/consent` | Read privacy flags |
| `DELETE /api/ai/memory` | Clear chat memory |
| `POST /api/money-mentor/chat` | Chat with consent + Turnstile (prod) + guards |
| `GET /api/money-mentor/history` | History when `aiMemoryEnabled` |
| `POST /api/money-mentor/clear` | Clear memory |
| `GET /api/ai-recommendations` | Auth + consent required (no dev bypass) |

## Client integration notes

1. Call **`POST /api/ai/consent`** once before first AI use.
2. Enable memory via settings: `PATCH /api/settings` with `{ "aiMemoryEnabled": true }`.
3. Money Mentor hook paths (`/api/money-mentor/chat`, `/history`, `/clear`) are now implemented.
4. Optional: pass `turnstileToken` on chat POST when Turnstile is configured in production.

## Error codes

| Code | Meaning |
|------|---------|
| `AI_CONSENT_REQUIRED` | User has not granted consent |
| `AI_OPT_OUT` | User opted out of AI |
| `PROMPT_INJECTION` | Message blocked by prompt guard |
| `RESTRICTED_TOPIC` | Personalized advice request blocked |
| `TURNSTILE_FAILED` | Bot check failed |

## Verification

```bash
npx prisma generate
npx prisma migrate deploy
npx jest lib/ai/__tests__/prompt-guard.test.ts lib/ai/__tests__/response-policy.test.ts
```

## Remaining (Phase 7+)

- Wire `AiPersonalization` UI to consent + memory toggles (`/api/ai/consent`, settings PATCH)
- Optional: external LLM provider with system preamble from `MONEY_MENTOR_SYSTEM_PREAMBLE`
