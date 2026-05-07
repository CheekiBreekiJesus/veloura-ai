# Veloura

A mobile app that analyzes a selfie using AI vision and generates a personalized beauty and fashion profile with color palette, style archetype, and curated recommendations — plus a live AI stylist chat and personal clothing wardrobe with AI compatibility scoring.

## Run & Operate

- API Server: `pnpm --filter @workspace/api-server run dev` (port 8080)
- Mobile: `pnpm --filter @workspace/mobile run dev` (Expo Go / web)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (auto-provisioned by Replit AI Integrations), `SESSION_SECRET` (for token signing)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), Expo Router, React Native
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (not yet used — no user persistence needed)
- AI: OpenAI GPT-4o vision (analyze + analyze-clothing) + GPT-4.1-mini (chat) via `@workspace/integrations-openai-ai-server`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for server)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/(tabs)/index.tsx` — Home screen (post-analysis + editorial onboarding)
  - `app/(tabs)/wardrobe.tsx` — Wardrobe: My Closet (user uploads) + AI Picks (recommendations with like/dislike)
  - `app/(tabs)/shop.tsx` — Shop with product detail modal
  - `app/(tabs)/wishlist.tsx` — Wishlist
  - `app/(tabs)/chat.tsx` — AI Stylist Chat tab (Aura) — profile-aware + personalized by feedback
  - `app/(tabs)/_layout.tsx` — 5-tab layout (Home, Wardrobe, Wishlist, Shop, Stylist)
  - `app/upload.tsx` — Photo upload + analysis trigger
  - `app/analyzing.tsx` — Animated analysis screen (fetches token → calls /api/analyze)
  - `app/add-item.tsx` — Modal: upload clothing photo → AI scores compatibility → save to closet
  - `app/profile.tsx` — Deep profile: aesthetic identity, color story, skin health, accessories
  - `app/settings.tsx` — Settings: name edit, 3-way theme toggle (System/Light/Dark), data clear
  - `context/AnalysisContext.tsx` — Shared analysis state (AsyncStorage backed)
  - `context/WardrobeContext.tsx` — Wardrobe items + feedback (liked/disliked) state (AsyncStorage backed)
  - `context/ThemeContext.tsx` — ThemePreference (system/light/dark) stored in AsyncStorage; provides resolved theme
  - `hooks/useColors.ts` — Reads from ThemeContext (not raw useColorScheme)
  - `constants/colors.ts` — Warm luxury palette (#FAF8F5 bg, #C4956A primary)
- `artifacts/api-server/src/routes/analyze.ts` — POST /api/analyze (OpenAI GPT-4o vision, selfie)
- `artifacts/api-server/src/routes/analyze-clothing.ts` — POST /api/analyze-clothing (GPT-4o, clothing compatibility scoring)
- `artifacts/api-server/src/routes/chat.ts` — POST /api/chat (GPT-4.1-mini, profile-aware + feedback-aware)
- `artifacts/api-server/src/routes/auth.ts` — GET /api/auth/token (short-lived HMAC token)
- `artifacts/api-server/src/middlewares/rateLimiter.ts` — express-rate-limit (10 req/15 min analyze)
- `artifacts/api-server/src/middlewares/requireAnalyzeToken.ts` — Bearer token validation
- `artifacts/api-server/src/lib/token.ts` — HMAC-SHA256 token issue/validate (SESSION_SECRET)
- `lib/api-spec/openapi.yaml` — Source of truth for all API contracts
- `lib/integrations-openai-ai-server/` — OpenAI SDK wrapper

## Architecture decisions

- Image is base64-encoded on device and sent as JSON body (no multipart form handling needed)
- Analysis results stored in AsyncStorage via AnalysisContext — no backend persistence
- User images stored as data: URIs (base64) in AsyncStorage — survives app restarts (temp file URIs do not)
- WardrobeContext is separate from AnalysisContext: manages user clothing items + liked/disliked feedback; persisted to AsyncStorage; provided at root level via WardrobeProvider
- Clothing AI analysis (GPT-4o vision, low detail) returns name, category, hex color, compatibility score 0-100, and notes — scored against user's actual style profile (undertone, season, archetypes, palette)
- Aura chat system prompt embeds both the full Aesthetic Identity Profile AND liked/disliked feedback so recommendations improve with use
- Token-based caller identity: mobile must GET /api/auth/token (HMAC-signed, 10 min TTL) before calling /api/analyze or /api/analyze-clothing — prevents unauthenticated proxy abuse
- Chat does NOT require the analyze token — uses its own rate limiter (60 req/15min per IP)
- OutfitCard in wardrobe always uses hardcoded dark text (#2D1F14) since gradients are always light pastels

## Product

- Upload a selfie → AI analyzes face shape, skin tone, undertone, eye shape, hair type, style archetype
- Full Aesthetic Identity Profile: jawline, cheekbone prominence, facial symmetry score, skin evenness, skin concerns, contrast level, color families
- **My Closet**: upload clothing photos → AI rates each item's compatibility (0-100) with your profile → browse your wardrobe with score badges
- **AI Picks**: AI-generated fashion recommendations filtered by Casual/Formal/Evening/Weekend; like/dislike each pick to train Aura
- **AI Stylist Chat (Aura)**: conversational AI that knows your full profile AND your liked/disliked picks; adapts to your feedback
- Browse curated mock product recommendations in the Shop tab (tap for detail modal, buy link)
- Light/Dark/System theme toggle in Settings
- All results and wardrobe items persisted locally (AsyncStorage) across restarts

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Web preview has rendering quirks (fonts/icons may appear faint) — use Expo Go on device for the real experience
- `lib/integrations-openai-ai-server` requires `@types/node` as a devDependency (already added)
- In Hermes/Metro, define helper components BEFORE the screen that uses them — hoisting is unreliable
- Ionicons show as Chinese symbols on Android/web if not explicitly loaded: add `...Ionicons.font` to the `useFonts({})` call in `_layout.tsx`
- POST /api/chat does NOT require the analyze token — it uses its own rate limiter (60 req/15min per IP)
- POST /api/analyze-clothing DOES require the analyze token (Bearer) — rate limited at 20 req/15min
- Chat token (for /api/analyze) is cached for 8 min client-side (token TTL is 10 min)
- OutfitCard gradients are always light pastels: hardcode text to #2D1F14 (never use colors.foreground there)
- WardrobeProvider must wrap the entire app (inside AnalysisProvider in _layout.tsx)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile patterns and device features
- See the `ai-integrations-openai` skill for OpenAI integration details
