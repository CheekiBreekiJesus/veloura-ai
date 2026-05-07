# Threat Model

## Project Overview

AI Identity Stylist is an Expo mobile application backed by a small Express API. Users upload a selfie, the API forwards that image to OpenAI vision, and the app stores the returned styling profile locally on the device. There is no user authentication, no server-side persistence of user profiles, and the only production API surface is a public image-analysis endpoint.

Production-scope assumptions for future scans:
- `NODE_ENV` is `production` in deployed environments.
- TLS is provided by the platform.
- `artifacts/mockup-sandbox/` is dev-only and should be ignored unless production reachability is demonstrated.

## Assets

- **User selfies and derived appearance profile** — uploaded face images and the returned analysis are highly sensitive biometric-adjacent personal data. Exposure would create privacy harm even without an account system.
- **OpenAI API credentials and quota** — compromise or abuse of the server-side OpenAI integration can create direct financial cost and service exhaustion.
- **API availability** — the app has a single core workflow. If `/api/analyze` is abused or destabilized, the product is effectively unavailable.
- **User-controlled local profile state** — analysis results, image URI, and user name are stored on-device and must be handled consistently with privacy promises.

## Trust Boundaries

- **Mobile client to API** — the client is untrusted and sends `imageBase64` and `mimeType` to the server. All validation and abuse controls must be enforced server-side.
- **API to OpenAI** — the backend forwards user-supplied image content to a third-party AI provider using privileged API credentials.
- **App storage boundary** — analysis results and some profile metadata are persisted in local AsyncStorage on the client.
- **Public boundary** — there are no authenticated or admin-only routes; any production API endpoint should be treated as Internet-accessible.

## Scan Anchors

- Production entry points: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/analyze.ts`, `artifacts/mobile/app/_layout.tsx`, `artifacts/mobile/app/analyzing.tsx`.
- Highest-risk areas: the public `POST /api/analyze` route, OpenAI client usage in `lib/integrations-openai-ai-server/`, and local persistence in `artifacts/mobile/context/AnalysisContext.tsx`.
- Public surface: `/api/healthz` and `/api/analyze`; there are no authenticated or admin surfaces.
- Dev-only areas to normally ignore: `artifacts/mockup-sandbox/`, build scripts under `artifacts/mobile/scripts/`, generated `dist/` outputs, and workspace helper libraries unless they are called by the production API path.

## Threat Categories

### Spoofing

This project has no user authentication, so the main spoofing concern is service-to-service trust rather than account takeover. The API must not assume the caller is a legitimate app instance simply because requests resemble mobile traffic. Any control that is meant to limit who can invoke `/api/analyze` must be enforced server-side rather than by obscurity in the mobile client.

### Tampering

The mobile client controls the request body sent to `/api/analyze`, including claimed MIME type and image payload. The server must validate request structure, acceptable content types, and practical size limits before forwarding data to OpenAI. The API must also validate the AI response shape before returning it to the client so malformed or unexpected upstream output cannot alter app behavior.

### Information Disclosure

Users submit sensitive face images to the backend, which then transmits them to OpenAI. The system must avoid leaking that data through logs, error messages, or unintended persistence, and privacy-related UI claims must match actual behavior. Locally stored profile data must be cleared when the app tells users it has been removed.

### Denial of Service

`/api/analyze` is a public, computationally and financially expensive endpoint. The service must apply effective abuse controls such as authentication or rate limiting, strict body-size and content validation, and bounded upstream call behavior so an attacker cannot exhaust API quota or tie up server resources with repeated or oversized requests.

### Elevation of Privilege

There are no user roles in the current product, so classic privilege escalation is limited. The practical privilege boundary is between unauthenticated Internet callers and the server’s privileged OpenAI credentials. The backend must not act as an unrestricted proxy that lets arbitrary callers spend server-held credentials on demand.
