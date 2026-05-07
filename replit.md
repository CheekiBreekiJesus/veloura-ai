# Veloura

A mobile app that analyzes a selfie using AI vision and generates a personalized beauty and fashion profile with color palette, style archetype, and curated recommendations — plus a live AI stylist chat.

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
- AI: OpenAI GPT vision (analyze) + GPT-4.1-mini (chat) via `@workspace/integrations-openai-ai-server`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for server)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/(tabs)/index.tsx` — Home (season card, feature DNA, daily tip, recommendations)
  - `app/(tabs)/wardrobe.tsx` — Wardrobe style guide (outfits 👗, palette 🎨, glasses 👓)
  - `app/(tabs)/chat.tsx` — AI Stylist Chat (Aura with real avatar, emoji suggestions)
  - `app/(tabs)/wishlist.tsx` — Saved recommendations
  - `app/(tabs)/shop.tsx` — Curated mock product browse
  - `app/upload.tsx` — Photo upload + analysis trigger
  - `app/analyzing.tsx` — Animated analysis screen (fetches token → calls /api/analyze)
  - `app/profile.tsx` — Deep profile: aesthetic identity, color story, skin health, accessories
  - `app/settings.tsx` — Settings: name edit, 3-way theme toggle (System/Light/Dark), data clear
  - `context/AnalysisContext.tsx` — Shared analysis state (AsyncStorage backed)
  - `context/ThemeContext.tsx` — ThemePreference (system/light/dark) stored in AsyncStorage; provides resolved theme
  - `hooks/useColors.ts` — Reads from ThemeContext (not raw useColorScheme)
  - `constants/colors.ts` — Warm luxury palette (#FAF8F5 bg, #C4956A primary)
  - `assets/images/icon.png` — AI-generated luxury gold line art face logo
  - `assets/images/aura-avatar.png` — AI-generated Aura stylist portrait avatar
- `artifacts/api-server/src/routes/analyze.ts` — POST /api/analyze (OpenAI vision)
- `artifacts/api-server/src/routes/chat.ts` — POST /api/chat (OpenAI chat, profile-aware)
- `artifacts/api-server/src/routes/auth.ts` — GET /api/auth/token (short-lived HMAC token)
- `artifacts/api-server/src/middlewares/rateLimiter.ts` — express-rate-limit (10 req/15 min)
- `artifacts/api-server/src/middlewares/requireAnalyzeToken.ts` — Bearer token validation
- `artifacts/api-server/src/lib/token.ts` — HMAC-SHA256 token issue/validate (SESSION_SECRET)
- `lib/api-spec/openapi.yaml` — Source of truth for all API contracts

## Architecture decisions

- Image is base64-encoded on device and sent as JSON body (no multipart form handling needed)
- Analysis results stored in AsyncStorage via AnalysisContext — no backend persistence
- ThemeContext wraps the entire app (inside KeyboardProvider, outside AnalysisProvider); preference saved to AsyncStorage key `veloura_theme`
- OutfitCard in wardrobe always uses hardcoded dark text (#2D1F14) since gradients are always light pastels — avoids light-on-light in dark mode
- OpenAI GPT vision used for face analysis; GPT-4.1-mini for chat (faster, cheaper)
- Chat system prompt embeds the full Aesthetic Identity Profile so Aura knows the user deeply
- Token-based caller identity: mobile must GET /api/auth/token (HMAC-signed, 10 min TTL) before calling /api/analyze or /api/chat — prevents unauthenticated proxy abuse
- Per-IP rate limiting (10 req/15 min) + global concurrency cap (3 in-flight) protect OpenAI quota
- MIME allowlist + base64 size cap (6 MB) applied before any OpenAI call

## Product

- Upload a selfie → AI analyzes face shape, skin tone, undertone, eye shape, hair type, style archetype
- Full Aesthetic Identity Profile: jawline, cheekbone prominence, facial symmetry score, skin evenness, skin concerns, contrast level, color families
- Accessories guide: earring styles + necklace lengths matched to face shape
- Aesthetic archetypes (2-4 style identities), makeup direction, fashion direction
- Color Season analysis (Spring/Summer/Autumn/Winter) with palette, best/avoid colors
- Feature DNA horizontal scroll on home (face, skin, undertone, eyes, hair, lips as gradient cards)
- Daily rotating tip card on home screen (personalized from analysis)
- **AI Stylist Chat (Aura)** — conversational AI tab with real portrait avatar; emoji suggestion chips; multi-turn; token auth + rate-limited
- Light/Dark/System theme toggle in Settings
- Browse curated mock product recommendations in the Shop tab
- Results persisted locally (AsyncStorage) so they survive app restarts

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Web preview has rendering quirks (fonts/icons may appear faint) — use Expo Go on device for the real experience
- `lib/integrations-openai-ai-server` requires `@types/node` as a devDependency (already added)
- In Hermes/Metro, define helper components BEFORE the screen that uses them — hoisting is unreliable
- Ionicons show as Chinese symbols on Android/web if not explicitly loaded: add `...Ionicons.font` to the `useFonts({})` call in `_layout.tsx`
- Chat token is cached for 8 min client-side (token TTL is 10 min) to avoid fetching a new token on every message
- OutfitCard gradients are always light pastels: hardcode text to #2D1F14 (never use colors.foreground there)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile patterns and device features
- See the `ai-integrations-openai` skill for OpenAI integration details
