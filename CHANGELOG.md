# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-18

First portfolio release of the Wild Life storefront.

### Added

- **Catalog** — home page with featured carousel, shop with search, category and
  brand filters, sorting and pagination, and a product detail page with variants,
  gallery, stock state and licence notices.
- **Localized content** — English and Portuguese UI, plus per-locale product and
  category translations resolved through `localizedText` with canonical
  fallback.
- **Auth** — sign in, registration, password reset, session restore and a
  user menu, with refresh handled centrally by the API client.
- **Cart** — hybrid cart: guest carts persist in `localStorage` and merge into
  the server cart on sign in.
- **Checkout** — address selection or creation, licence collection for regulated
  products, payment method selection (MB WAY, Multibanco, credit card, Klarna),
  coupon entry and a receipt with payment instructions.
- **Account and orders** — profile, address book, password change and order
  history with a detail view.
- **Admin console** — dashboard, products, categories, brands, stock movements,
  orders, coupons, promotions, newsletter and users.
- **Shared design atoms** — `components/ui` (`Input`, `Select`, `Textarea`,
  `Label`, `Spinner`) backed by one style source.
- **Testing** — Vitest, Testing Library and MSW across unit, API, hook, component
  and routed-flow layers, with coverage thresholds enforced.
- **Architecture guard** — `src/architecture.test.ts` fails the build when a
  feature imports another feature.

### Changed

- Auth and cart state moved out of the feature folders into `src/providers/`, so
  features no longer import each other.
- Checkout, the auth dialog, the admin product form and the storefront shell were
  split into smaller components so their behaviour can be tested directly.

### Fixed

- **Admin stock movements could never be saved.** `stockMovementSchema` requires
  `productItemId`, but the form never registered it, so validation always failed
  silently. The selected item now feeds the form value.
- **Admin could not save a category without a parent.** The "no parent" option
  used `NaN` as its value, which the optional numeric schema rejects. It is now
  an empty value mapped to `undefined`.
- **Coupon limits, promotion priority and product weight blocked saves when
  left blank.** Empty optional number fields became `NaN`; they now map to
  `undefined` through `toOptionalNumber`.
- **Order status changes were never sent.** `updateOrderStatus` used `GET` on the
  order path instead of `PATCH /orders/{orderNumber}/status`, so the order was
  returned unchanged and the admin's action had no effect.
- **Checkout redirected to the cart while it was still loading.** The server cart
  starts empty, so a signed-in shopper was bounced before their cart arrived.
  The cart provider now exposes `isLoading` and checkout waits for it.
- **Checkout never preselects the saved address** when the session restores after
  the first render, leaving "Continue" disabled.
- **The newsletter CSV export failed on an expired session.** `apiFetchText` now
  refreshes and retries exactly like `apiFetch`.
- **Nav dropdowns closed immediately on click** because hover had already opened
  them; click is now idempotent.
- **Accessibility**: form labels are associated with their inputs, cart and
  quantity controls have accessible names, checkout options are keyboard
  selectable radio groups, and the loading spinner announces a localized label.

[1.0.0]: https://github.com/tiagofsps/hunting-fishing-store-web/releases/tag/v1.0.0
