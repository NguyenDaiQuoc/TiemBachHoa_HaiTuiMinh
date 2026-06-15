# Current Phase: Phase 9X - Store Stabilization & Content Platform

## Status: In Progress

## Objective
Transform Hai Tụi Mình into a stable, trustworthy, production-ready ecommerce platform before introducing social/community systems.

## Community Scope
- STATUS: DEFERRED
- TARGET PHASE: FUTURE
- Architecture, routers, models, and PDP review infrastructure are preserved.
- Public `/community` routing and visible header/account entry points are disabled.
- Deferred backlog lives at `docs/future-phases/community-backlog.txt`.

## Completed In Phase 9X
- [x] Deferred community/social/creator/affiliate features into future backlog
- [x] Redirected `/community` away from storefront navigation
- [x] Replaced header/account community entry points with content platform entry points
- [x] Added `/blog` and `/blog/:slug` content platform routes
- [x] Added buying guides, comparisons, tips, how-to content, FAQ blocks, related articles, and related products
- [x] Added trust/conversion pages: `/store`, `/why-buy`, `/authentic-guarantee`
- [x] Added metadata, Open Graph, canonical, JSON-LD helpers, robots.txt, and sitemap.xml
- [x] Replaced fake PDP related products with real category-based API results
- [x] Added PDP enrichment sections for frequently bought together, comparison table, similar products, and recently viewed products

## Remaining Audit Areas
- [ ] Full encoding cleanup across legacy pages still showing mojibake
- [ ] Header/footer/search/profile/wishlist/dark-mode browser QA sweep
- [ ] Checkout/tracking real-payment and real-shipping audit follow-up
- [ ] Loading and empty-state pass for older admin/storefront surfaces
