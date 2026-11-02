# Mobile app (Phase 3)

Planned: **Expo (React Native)**, added to this monorepo once the storefront is live.

It will reuse, unchanged:

- `@sweets/api-client` — the same typed client the website and ERP use
- `@sweets/types` — shared request/response types and validation schemas
- the NestJS API — orders placed in the app use `channel: "APP"`

To scaffold when ready:

```bash
cd apps && pnpm create expo-app mobile --template default
```

Then add `"@sweets/api-client": "workspace:*"` and `"@sweets/types": "workspace:*"` to its
`package.json`, and store tokens with `expo-secure-store` instead of `localStorage`.
