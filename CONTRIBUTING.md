# Contributing to this fork

This is a personal, self-maintained fork. There is no external contribution
process; these notes exist so the maintainer (and any future reader) can build,
test, and change the dashboard without rediscovering the workflow.

Security-sensitive findings should not be filed in a public issue or pull
request. Follow the [security policy](.github/SECURITY.md) instead.

## Prerequisites and setup

- Node.js 24 (see [`.node-version`](.node-version))
- Corepack with pnpm 10.34.1 (see the `packageManager` field in
  [`package.json`](package.json))

```shell
corepack enable
pnpm install
```

This repository is a pnpm workspace with two packages:

| Package                  | Responsibility                                        |
| ------------------------ | ----------------------------------------------------- |
| `packages/ui`            | Nuxt dashboard and static panel output                |
| `packages/config-editor` | Monaco-based profile editor consumed by `packages/ui` |

Read [CONTEXT.md](CONTEXT.md) for the domain language. UI work should also
follow [PRODUCT.md](packages/ui/PRODUCT.md) and
[DESIGN.md](packages/ui/DESIGN.md).

## Develop and build

Run commands from the repository root.

| Task                | Command         |
| ------------------- | --------------- |
| Development server  | `pnpm dev`      |
| Static panel output | `pnpm build:ui` |

`pnpm build:ui` writes the static site to `packages/ui/.output/public`. The
release workflow builds the same output with `NUXT_APP_BASE_URL='./'` so the
result works from any path, including mihomo's local `external-ui` directory.

## Tests and checks

```shell
pnpm typecheck
pnpm lint
pnpm --filter @metacubexd/ui test:unit
pnpm --filter @metacubexd/ui test:e2e
```

`pnpm lint` runs the UI linter with `--fix`; inspect its changes before staging
them. End-to-end tests require Playwright's Chromium binary:

```shell
pnpm --filter @metacubexd/ui exec playwright install chromium
```

If a check cannot run on your platform, say so plainly rather than implying it
passed.

## Documentation and translations

- Update the README when behavior, configuration, or deployment changes.
- Keep the seven locale files in `packages/ui/i18n/locales` aligned when adding
  or changing user-facing text.
- Never put tokens, subscription URLs, profile contents, private keys, or other
  credentials in fixtures, logs, screenshots, or commits.

Markdown files can be checked with the repository's Prettier installation:

```shell
pnpm exec prettier --check README.md CONTRIBUTING.md .github/SECURITY.md
```

## Commits

Use focused [Conventional Commits](https://www.conventionalcommits.org/) such
as `fix(ui): correct proxy latency sort order`. `release-please` derives the
version and changelog from these messages, so the type and scope matter. Avoid
committing generated build output, and only change `pnpm-lock.yaml` when
dependencies or their resolution actually changed.
