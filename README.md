<div align="center">

# metacubexd (personal fork)

**Mihomo Dashboard — self-maintained fork**

A modern, beautiful, and fully-featured web dashboard for [Mihomo](https://github.com/MetaCubeX/mihomo) (Clash Meta).

[![build](https://img.shields.io/github/actions/workflow/status/BELUGA114/metacubexd/release.yml?style=for-the-badge)](https://github.com/BELUGA114/metacubexd/actions)
[![release](https://img.shields.io/github/v/release/BELUGA114/metacubexd?style=for-the-badge)](https://github.com/BELUGA114/metacubexd/releases/latest)
[![license](https://img.shields.io/github/license/BELUGA114/metacubexd?style=for-the-badge)](./LICENSE)
[![last-commit](https://img.shields.io/github/last-commit/BELUGA114/metacubexd?style=for-the-badge)](https://github.com/BELUGA114/metacubexd/commits)

**[Latest panel build](https://github.com/BELUGA114/metacubexd/releases/latest)** · **[Upstream project](https://github.com/MetaCubeX/metacubexd)**

</div>

---

> ### ℹ️ About this fork
>
> This is a **personal fork of [MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd)**,
> maintained for its author's own use. It is **not** an official MetaCubeX
> release and is **not** endorsed by the upstream maintainers.
>
> **What it ships:** only the static web dashboard (the hosted-panel form),
> published as a `compressed-dist.zip` asset on this repository's releases.
>
> **What it does not ship:** the upstream desktop application, the
> `ghcr.io/metacubex/*` Docker images, the Homebrew cask, and the hosted
> `d.metacubex.one` site. All of those remain available from upstream.
>
> If you want the officially supported dashboard, use
> [the upstream project](https://github.com/MetaCubeX/metacubexd) instead, and
> please do not report problems with this fork to upstream.

---

## ⚡ Quick start

Download `compressed-dist.zip` from the
[latest release](https://github.com/BELUGA114/metacubexd/releases/latest) and
extract it somewhere mihomo can read:

```shell
mkdir -p /etc/mihomo/ui
unzip -q compressed-dist.zip -d /etc/mihomo/ui
```

Then enable the external controller and point `external-ui` at that directory in
your mihomo `config.yaml`:

```yaml
external-controller: 127.0.0.1:9090
secret: 'replace-with-a-strong-secret'
external-ui: /etc/mihomo/ui
```

The build uses **relative asset paths**, so the same output also works when
served from any static web server or from a reverse-proxy sub-path.

## ✨ Features

- 📊 Real-time traffic monitoring and statistics
- 🔄 Proxy group management with latency testing
- 📡 Connection tracking and management
- 📋 Rule viewer with search functionality
- 📝 Live log streaming
- 🎨 32 selectable themes with user color overrides
- 📱 Fully responsive design for mobile devices
- 🌐 Seven languages: English, 简体中文, Русский, 日本語, 한국어, Français, فارسی

## 🖼️ Preview

<details>
<summary><b>Desktop Screenshots</b></summary>

|                           Overview                            |                           Proxies                           |
| :-----------------------------------------------------------: | :---------------------------------------------------------: |
| <img src="docs/pc/overview.png" alt="overview" width="400" /> | <img src="docs/pc/proxies.png" alt="proxies" width="400" /> |

|                             Connections                             |                          Rules                          |
| :-----------------------------------------------------------------: | :-----------------------------------------------------: |
| <img src="docs/pc/connections.png" alt="connections" width="400" /> | <img src="docs/pc/rules.png" alt="rules" width="400" /> |

|                         Logs                          |                          Config                           |
| :---------------------------------------------------: | :-------------------------------------------------------: |
| <img src="docs/pc/logs.png" alt="logs" width="400" /> | <img src="docs/pc/config.png" alt="config" width="400" /> |

</details>

<details>
<summary><b>Mobile Screenshots</b></summary>

|                             Overview                              |                             Proxies                             |                               Connections                               |
| :---------------------------------------------------------------: | :-------------------------------------------------------------: | :---------------------------------------------------------------------: |
| <img src="docs/mobile/overview.png" alt="overview" width="200" /> | <img src="docs/mobile/proxies.png" alt="proxies" width="200" /> | <img src="docs/mobile/connections.png" alt="connections" width="200" /> |

|                            Rules                            |                           Logs                            |                            Config                             |
| :---------------------------------------------------------: | :-------------------------------------------------------: | :-----------------------------------------------------------: |
| <img src="docs/mobile/rules.png" alt="rules" width="200" /> | <img src="docs/mobile/logs.png" alt="logs" width="200" /> | <img src="docs/mobile/config.png" alt="config" width="200" /> |

</details>

> Screenshots are inherited from upstream and are no longer regenerated
> automatically in this fork, so they may lag behind the current UI.

## 🚀 Deployment

This fork ships exactly one form: the **static dashboard**, pointed at a mihomo
instance you run yourself. The dashboard talks directly to mihomo's Clash API
(`external-controller`); there is no backend of its own.

### 1. Expose and protect mihomo's external controller

```yaml
external-controller: 0.0.0.0:9090
secret: 'replace-with-a-strong-secret'
```

Binding to `0.0.0.0` exposes the controller on every interface. Restrict it with
a firewall, use a strong secret, and configure
[`external-controller-cors`](#unable-to-connect-to-backend-cors) for the exact
dashboard origin.

For a safe starting point, see the
[minimal mihomo configuration example](./docs/config.yaml). Review its network
settings before making the controller reachable beyond the local machine.

### 2. Serve the dashboard

Pick whichever fits your setup:

- **mihomo's `external-ui`** — extract the release tarball into a directory and
  set `external-ui` to it (see [Quick start](#-quick-start)). mihomo serves the
  panel itself, on the same origin as the Clash API, which avoids CORS entirely.
- **Any static web server** — nginx, Caddy, `python -m http.server`, or a
  reverse-proxy sub-path. Relative asset paths mean no rebuild is needed.
- **Build it yourself** — see [Development](#-development).

Open the served page and enter your mihomo `{url, secret}` on the connect
screen.

## 🩺 Troubleshooting

### "Unable to connect to backend" (CORS)

If the dashboard loads but cannot reach mihomo — even though the external
controller answers directly in your browser — the cause is usually **CORS**.

When the dashboard is served from its own address (e.g.
`http://192.168.1.2:8080`), the browser treats requests to the external
controller (e.g. `http://192.168.1.2:9090`) as cross-origin. mihomo only answers
cross-origin requests from origins in its `external-controller-cors` allow-list.

Add the dashboard's origin to that allow-list in your mihomo `config.yaml`:

```yaml
external-controller-cors:
  allow-private-network: true
  allow-origins:
    - 'http://192.168.1.2:8080' # your dashboard's address
    # or, for trusted local networks only:
    # - '*'
```

> Tip: open DevTools (F12) → Console and look for CORS errors to confirm the
> cause. Serving the panel through mihomo's own `external-ui` sidesteps this
> entirely, because the panel and the Clash API then share one origin.

### Mixed content: HTTPS page cannot call an HTTP backend

A dashboard served over **HTTPS** cannot call a plain **HTTP** Clash API — the
browser blocks it as mixed content, usually with no visible error beyond a
failed connection. Serve the panel over HTTP when the backend is HTTP, or put
both behind TLS.

### Stale UI after updating the panel

The panel registers a service worker that pre-caches its assets. After replacing
the files, close every tab for that origin and reopen it so the new service
worker activates; a single reload may keep serving the old cached build.

## 🛠️ Development

This repository is a **pnpm 10 workspace** with two packages:

- `packages/ui` — Nuxt dashboard and static panel output
- `packages/config-editor` — Monaco-based profile editor consumed by the UI

```shell
pnpm install

pnpm dev        # Nuxt dev server; connect it to an existing mihomo
pnpm build:ui   # static output -> packages/ui/.output/public

pnpm typecheck
pnpm lint
```

The release workflow builds with `NUXT_APP_BASE_URL='./'` so the output works
from any path, then attaches `compressed-dist.zip` to a GitHub release. To
reproduce that locally:

```shell
NUXT_APP_BASE_URL='./' pnpm --filter @metacubexd/ui generate
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for tests and conventions.

## 📚 Project documentation

- [Contributing and local workflow](./CONTRIBUTING.md)
- [Security policy and private vulnerability reporting](./.github/SECURITY.md)
- [Domain vocabulary](./CONTEXT.md) — inherited from upstream; still describes
  the desktop and all-in-one-server forms that this fork does not build
- [UI product principles](./packages/ui/PRODUCT.md)
- [UI design system](./packages/ui/DESIGN.md)
- [Example mihomo configuration](./docs/config.yaml)

## 📄 License, rights, and attribution

**License.** This project is distributed under the **MIT License**, inherited
unchanged from upstream. The original copyright notice is retained verbatim in
[LICENSE](./LICENSE):

> MIT License Copyright (c) 2023 MetaCubeX

**Original work.** The dashboard was created and is maintained upstream at
[MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd) by **MetaCubeX
and its contributors**. All code, design, and documentation originating upstream
remain the copyright of their respective authors. Credit for the overwhelming
majority of this software belongs to them, not to this fork. The upstream
contributor list is at
[the upstream contributors graph](https://github.com/MetaCubeX/metacubexd/graphs/contributors),
and upstream history is preserved in this repository's git log and
[CHANGELOG.md](./CHANGELOG.md).

**This fork's changes.** Modifications made in this repository are released under
the same MIT License. Redistributing this fork — as source, as the built static
output, or as the `compressed-dist.zip` release asset — **must retain the
upstream copyright notice and the MIT permission notice**, exactly as the license
requires. Do not strip [LICENSE](./LICENSE) from a redistributed build.

**No affiliation or endorsement.** This is an independent personal fork. It is
not an official MetaCubeX product, carries no endorsement from the upstream
maintainers, and must not be presented as the official dashboard. It comes with
no warranty and no support commitment, as stated in the MIT License.

**Names and trademarks.** "MetaCubeXD", "MetaCubeX", "Mihomo", and "Clash" appear
here only to identify the upstream software this fork derives from and
interoperates with. No ownership of, or endorsement by, those projects is
claimed.

## 🙏 Credits

- [MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd) — the upstream
  dashboard this fork is built from
- [Mihomo](https://github.com/MetaCubeX/mihomo) — the proxy kernel this dashboard
  controls
- [Nuxt](https://github.com/nuxt/nuxt) - The Intuitive Vue Framework
- [Vue.js](https://github.com/vuejs/core) - The Progressive JavaScript Framework
- [daisyUI](https://github.com/saadeghi/daisyui) - Tailwind CSS components
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
