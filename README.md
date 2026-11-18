# Wild Life — Hunting & Fishing Store

[![CI](https://github.com/tiagofsps/hunting-fishing-store-web/actions/workflows/ci.yml/badge.svg)](https://github.com/tiagofsps/hunting-fishing-store-web/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-414%20passing-brightgreen)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

**Wild Life** is the storefront for the Hunting & Fishing Store: a React single-page
app for a regulated sporting-goods retailer. It covers the whole customer journey —
catalog, cart, checkout with licence verification, payments, account and order
history — plus a complete admin console.

The API lives in a separate repository,
[hunting-fishing-store](https://github.com/tiagofsps/hunting-fishing-store).

![Storefront home page](docs/images/storefront-home.png)

## About this project

This began as a store concept a friend wanted to open. I took it on as a learning
vehicle — Spring Boot 4 on the backend, React 19 on the frontend — and it grew into
a complete store: catalog, cart, checkout with licence verification, payments,
order history and an admin console. The store never went to market, so the code is
published as a portfolio piece rather than a product. It is MIT licensed and free
to read or reuse; contributions are not expected.

Hunting and fishing gear is regulated: some products require a licence, some ship
with legal notices, and prices change with promotions and coupons. The app has to
be honest about all of that while staying fast and pleasant to use.

What is interesting here, beyond the usual storefront work:

- **Licence enforcement at checkout.** A cart containing regulated items collects
  the missing hunting or fishing licence before payment, and the UI explains why.
- **Bilingual content, not just bilingual chrome.** The interface is English and
  Portuguese, and product and category text is translated per locale with the
  canonical value as fallback.
- **A hybrid cart.** Guests get a local cart; signing in merges it into the server
  cart exactly once, with server quantities winning.
- **An admin console that mirrors the backend rules.** Order transitions are
  limited to the states the API allows, and the forms send only the fields the
  backend validates as optional.

Scope: frontend only. There is no server-side rendering, no native app and no
payment SDK — payments redirect to the URL the API returns.

## Features

| Area | What it does |
|---|---|
| Home | Hero, featured carousel, brand strip, newsletter signup, quick view |
| Catalog | Search, category and brand filters, sorting, pagination, product detail with variants and stock state |
| Auth | Sign in, registration, password reset, session restore, user menu |
| Cart | Guest cart in `localStorage`, server sync when signed in, free-shipping progress |
| Checkout | Address selection or creation, licence collection, payment method, coupon, receipt with instructions |
| Account | Profile, address book, password change |
| Orders | History and a detail view with payment instructions |
| Admin | Dashboard, products, categories, brands, stock movements, orders, coupons, promotions, newsletter, users |

![Shop page with filters](docs/images/storefront-shop.png)

## Architecture

```mermaid
flowchart TB
  subgraph app[App shell]
    Layout[Layout]
    Navbar[Navbar / Footer / UserMenu]
    Overlays[OverlayProvider<br/>cart drawer, auth modal, quick view]
  end
  subgraph providers[src/providers — app-wide state]
    Auth[AuthProvider / useAuth]
    Cart[CartProvider / useCart]
  end
  subgraph features[src/features — feature modules]
    Home[home-page]
    Catalog[catalog]
    Detail[product-detail]
    CartF[cart]
    Checkout[checkout]
    Account[account]
    Orders[orders]
    Admin[admin]
  end
  subgraph shared[Shared]
    UI[components/ui atoms]
    Api[lib/apiClient]
    I18n[i18n]
  end
  Layout --> Navbar
  Layout --> Overlays
  Layout --> Auth
  Auth --> Cart
  Cart --> Features
  features --> Api
  features --> UI
  features --> I18n
```

Rules, enforced by `src/architecture.test.ts`:

- a **feature never imports another feature**;
- app-wide session and cart state lives in `src/providers/`, which may import a
  feature's `api`, `validation` and `types` modules only;
- shared UI lives in `src/components/` (form atoms in `components/ui/`).

See [docs/architecture/frontend-structure.md](docs/architecture/frontend-structure.md)
for the full conventions.

## Tech stack

| Concern | Choice |
|---|---|
| UI | React 19, React Router 8 |
| Language | TypeScript 6 (`verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 with semantic theme tokens |
| Forms | react-hook-form + zod 4 |
| State | React context in `src/providers/` |
| Tests | Vitest 5, Testing Library, MSW |

## Quickstart

The app needs the API. Start the backend first:

```bash
git clone git@github.com:tiagofsps/hunting-fishing-store.git
cd hunting-fishing-store
docker compose up -d            # PostgreSQL + Redis
./mvnw spring-boot:run          # API on http://localhost:8080, seeds demo data
```

Then the storefront:

```bash
git clone git@github.com:tiagofsps/hunting-fishing-store-web.git
cd hunting-fishing-store-web
pnpm install
pnpm dev                        # http://localhost:5173
```

The dev server proxies `/api`, `/images`, `/brands`, `/uploads` and `/static` to
`http://localhost:8080`, so there is no CORS setup to do.

### Demo accounts

Seeded by the backend on an empty database:

| Account | Email | Password |
|---|---|---|
| Admin | `admin@huntingfishing.com` | `Password123!` |
| Shopper | `user@huntingfishing.com` | `Password123!` |

Sign in as the admin and open `/admin` for the console.

## Testing

```bash
pnpm test            # 414 tests
pnpm test:coverage   # enforces 90% lines/statements and 80% branches
pnpm typecheck
pnpm lint
```

Coverage at the 1.0.0 snapshot: **93.6% lines, 91.2% statements, 81.3% branches,
87.9% functions**.

The suite is layered: pure units and schemas, API contract tests that assert the
method, path and body of every request, hook and provider behaviour, component
tests driven by user events, and a few routed flows through the real providers.
HTTP is mocked with MSW, so no backend is needed.

See [docs/testing.md](docs/testing.md) for the harness and conventions.

## Tradeoffs and what I'd do differently

- **The access token lives in `localStorage`.** It survives reloads without extra
  work, but it is readable by any script. I'd move it to memory and refresh
  silently on load, which needs a small change on the API side.
- **Tests stop at the network boundary.** MSW gives fast, deterministic coverage of
  every layer, but nothing proves the app against a running backend. A small
  Playwright suite for the checkout and admin flows is the obvious next step.
- **No container image for the SPA.** It calls same-origin `/api` paths, so it only
  works behind a reverse proxy. Shipping an image without that contract would be
  misleading, so deployment is documented instead of packaged.
- **Some admin forms duplicate payload mapping.** The category and brand mappers
  were extracted and tested, but a shared form-to-payload layer would remove the
  remaining repetition.


- [Frontend structure and conventions](docs/architecture/frontend-structure.md)
- [Testing guide](docs/testing.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © 2026 Tiago Pires.

You are free to use, copy, modify and distribute this code. It was written as a
training and portfolio project, so treat it as a reference rather than a
production system.
