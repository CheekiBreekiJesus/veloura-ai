# AI Identity Stylist

A mobile app that analyzes a selfie using AI vision and generates a personalized beauty and fashion profile with color palette, style archetype, and curated recommendations.

## Run & Operate

- API Server: `pnpm --filter @workspace/api-server run dev` (port 8080)
- Mobile: `pnpm --filter @workspace/mobile run dev` (Expo Go / web)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (auto-provisioned by Replit AI Integrations)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), Expo Router, React Native
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (not yet used — no user persistence needed)
- AI: OpenAI GPT vision via `@workspace/integrations-openai-ai-server`
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle for server)

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/index.tsx` — Landing screen
  - `app/upload.tsx` — Photo upload + analysis trigger
  - `app/dashboard.tsx` — Results dashboard (Profile, Beauty, Fashion, Products tabs)
  - `context/AnalysisContext.tsx` — Shared analysis state (AsyncStorage backed)
  - `constants/colors.ts` — Warm luxury palette (#FAF8F5 bg, #C4956A primary)
- `artifacts/api-server/src/routes/analyze.ts` — POST /api/analyze (OpenAI vision)
- `lib/api-spec/openapi.yaml` — Source of truth for API contracts
- `lib/integrations-openai-ai-server/` — OpenAI SDK wrapper

## Architecture decisions

- Image is base64-encoded on device and sent as JSON body (no multipart form handling needed)
- Analysis results stored in AsyncStorage via AnalysisContext — no backend persistence
- Stack navigation (no tabs) for a clean linear flow: Landing → Upload → Dashboard
- OpenAI GPT-5.4 used for vision analysis; returns strict JSON matching the AnalysisResult schema
- Dashboard uses tab-based sections (Profile, Beauty, Fashion, Shop) within the results screen

## Product

- Upload a selfie → AI analyzes face shape, skin tone, undertone, eye shape, hair type, style archetype
- Receive a personalized color palette (5-8 hex colors), beauty/fashion/hair/glasses recommendations
- Color Season analysis (Spring/Summer/Autumn/Winter) with palette, best/avoid colors, gradient card on home + full detail on profile screen
- Daily rotating tip card on home screen (personalized from analysis, falls back to generic tips)
- Season badge pill on profile card; "Details" button links to profile screen
- Browse curated mock product recommendations in the Shop tab
- Results persisted locally (AsyncStorage) so they survive app restarts

## User preferences

_Populate as you build._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- Web preview has rendering quirks (fonts/icons may appear faint) — use Expo Go on device for the real experience
- `lib/integrations-openai-ai-server` requires `@types/node` as a devDependency (already added)
- In Hermes/Metro, define helper components BEFORE the screen that uses them — hoisting is unreliable. `SeasonCard` and `DailyTip` must appear above `HomeScreen` in `index.tsx`
- Ionicons show as Chinese symbols on Android/web if not explicitly loaded: add `...Ionicons.font` to the `useFonts({})` call in `_layout.tsx`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for mobile patterns and device features
- See the `ai-integrations-openai` skill for OpenAI integration details
