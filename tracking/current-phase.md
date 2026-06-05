# Current Phase: Phase 9 - Social Commerce & Community Engine

## Status: In Progress

## Overview
Transforming the storefront into a community-driven shopping ecosystem with real review data, social proof, gamification, and private AI-assisted support.

## Completed (Phase 8I)
- [x] Global App Shell inheritance for `/profile`
- [x] Theme hydration hardening
- [x] Dark mode restoration for account surfaces
- [x] Layout persistence regression coverage

## Key Goals
- [x] Dedicated `/community` route inside the shared storefront shell
- [x] Review and rating data foundation with persistence
- [x] Social proof wiring for product detail pages
- [x] Floating support actions with AI chat, Zalo, Messenger, and back-to-top
- [ ] Extended automated QA, accessibility sweeps, and social flow coverage

## Recent Updates
- Mounted `community-router.ts` at `/api/community`
- Added community data hooks for reviews, social proof, feed, check-in, referral, missions, and support chat
- Added `/community` as a separate branch without changing the main storefront information architecture
- Added one dedicated community header entry and shared floating actions in `AppShell`
- Replaced mocked PDP review/social proof behavior with real community-backed review summaries, filters, media submission, and helpful interactions
- Hardened admin navigation so only the active sidebar item is highlighted
- Added persisted admin locale switching (`VI/EN`) and refreshed admin shell copy
- Reworked admin inventory and product flow with receiving history, low-stock alerts, Excel export, and richer SKU fields
- Added persisted notification center APIs and dropdown UX for both storefront users and admins
- Upgraded notifications to realtime SSE delivery, richer icon and status treatments, and dedicated full notification pages
- Added scroll-aware back-to-top support for floating actions and the admin shell
- Synced Prisma schema, regenerated client, reseeded test accounts, and verified `npm.cmd run lint` plus `npm.cmd run build`
- Added realtime SSE inbox updates for both storefront support chat and `/admin/support`
- Added support workflow states for `Dang cho`, `Da nhan`, `Dang xu ly`, and `Da doc`
- Refined the user support drawer into a more commerce-style support center with clearer channel switching and conversation context
