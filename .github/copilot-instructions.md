# Copilot Instructions for this fork

This is a self-maintained fork of [MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd)
that keeps only the dashboard (hosted-panel) form. The static UI connects
directly to a user-managed Mihomo through its Clash API. Preserve the boundary
between Mihomo's Clash API and the (upstream) Control API surface.

## Read First

- [CONTEXT.md](../CONTEXT.md) defines the project's domain language. It still
  describes the upstream desktop and all-in-one-server forms, which this fork
  does not build.
- [packages/ui/PRODUCT.md](../packages/ui/PRODUCT.md) defines the product and its
  users.
- [packages/ui/DESIGN.md](../packages/ui/DESIGN.md) defines the UI design system.
- [README.md](../README.md) documents what this fork ships.

## Monorepo Map

This is a pnpm 10 workspace with two workspaces:

| Workspace                | Responsibility                                        |
| ------------------------ | ----------------------------------------------------- |
| `packages/ui`            | Nuxt 4/Vue 3 dashboard and static panel output        |
| `packages/config-editor` | Monaco-based profile editor consumed by `packages/ui` |

The upstream `packages/agent`, `apps/server`, and `apps/desktop` workspaces were
removed from this fork along with the Docker, desktop, and Homebrew distribution
pipelines. Do not reintroduce host-specific behavior into `packages/ui`.

## Runtime Form

There is one runtime form: the static UI connects directly to a user-managed
Mihomo. There is no Control Agent, so the UI's agent-only features stay hidden
through capability gating. Mihomo's `external-controller` defaults to port
`9090` and its mixed proxy to `7890`; never hard-code endpoints in UI code.

## API Boundary

- **Clash API** is Mihomo's `external-controller` HTTP/WebSocket surface. It owns
  proxies, proxy groups, traffic, connections, rules, configs, version, and live
  Clash log data. UI access is centered on `packages/ui/composables/useApi.ts`,
  `useWebSocket.ts`, and the endpoint store. This is the only backend this fork
  talks to in practice.
- **Control API** is the upstream `/api/control/**` surface owned by the removed
  agent. Its client code remains in `packages/ui/composables/useControlApi.ts`
  and stays inert because no agent advertises the capabilities. Keep it
  capability-gated rather than assuming it is reachable.

Do not send Clash API traffic through the Control API, and do not confuse Clash
WebSocket logs with the agent's kernel-process SSE logs.

## UI Stack and Conventions

- Nuxt 4, Vue 3, strict TypeScript, CSR-only rendering, and hash routing.
- Pinia owns shared client state; persistent state commonly uses VueUse
  `useLocalStorage`.
- TanStack Vue Query owns server-state queries and invalidation. Keep query keys
  stable and invalidate affected data after mutations.
- `ky` v2 is the HTTP client. This version uses `prefix`, not `prefixUrl`.
- Tailwind CSS v4 and daisyUI v5 provide styling. Follow semantic daisyUI roles
  and the design system rather than hard-coded theme colors.
- Vue, Nuxt, VueUse, project composables, stores, utilities, constants, types,
  and components are auto-imported according to `packages/ui/nuxt.config.ts`.
- Use `<script setup lang="ts">`, explicit props/emits types, computed values for
  derived state, and watchers only for side effects.

Do not assume Zod, `tailwind-merge`, `tailwind-variants`, or
`@tanstack/vue-table` exists in this repository. Tables and conditional classes
use project components and normal Vue/Tailwind patterns.

### Internationalization

All user-facing UI text must use `useI18n()`. Keep the seven JSON locale files
in `packages/ui/i18n/locales/` aligned:

`en.json`, `fa.json`, `fr.json`, `ja.json`, `ko.json`, `ru.json`, `zh.json`.

Add the same key to every locale and preserve valid JSON. Do not create legacy
TypeScript locale modules.

## Commands

Run commands from the repository root.

```bash
pnpm install    # install the workspace
pnpm dev        # alias for dev:ui; Nuxt development server
pnpm dev:ui     # Nuxt development server
pnpm build:ui   # nuxt generate -> packages/ui/.output/public
pnpm build      # alias for build:ui
pnpm generate   # build:ui, then copy packages/ui/.output to root .output
pnpm typecheck  # run workspace typecheck scripts
pnpm lint       # runs available lint scripts; UI only and auto-fixes
```

The release workflow builds with `NUXT_APP_BASE_URL='./'` so the static output
works from any path, then attaches `compressed-dist.tgz` to a GitHub release.

### Package checks

```bash
pnpm --filter @metacubexd/ui test:unit
pnpm --filter @metacubexd/ui test:e2e
pnpm --filter @metacubexd/ui typecheck
```

Prefer a targeted Vitest invocation while iterating, then run the full test and
typecheck scripts before handoff.

## Test Locations

UI unit specs live beside their areas under `**/__tests__/**/*.spec.ts`; UI
browser-flow specs live in `packages/ui/e2e/`. Add regression coverage next to
the behavior it covers.

## Editing and Quality Rules

- Preserve strict TypeScript types and existing dependency-injection seams.
- Keep the UI's Control API client capability-gated; do not make agent-only
  features unconditional.
- `pnpm lint` invokes ESLint with `--fix`; inspect resulting changes and do not
  run it casually across unrelated work.
- Do not hand-edit generated output: `.nuxt/`, `.output/`, or
  `packages/ui/.output/`.
- Do not edit `CHANGELOG.md`; release-please owns it. Entries above this fork's
  divergence point describe upstream history.
- Do not edit `pnpm-lock.yaml` manually; regenerate it through pnpm when a
  dependency change is intentional.
