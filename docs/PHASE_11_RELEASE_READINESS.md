# LearnFlow Phase 11 — Release Readiness

Phases 2–10 must not be promoted to `main` until the release candidate satisfies the gates below.

## Automated gates

- [x] UI production build succeeds.
- [x] Angular production configuration uses optimization and hashed output.
- [x] Initial bundle and component-style budgets are enforced.
- [x] API TypeScript typecheck succeeds.
- [x] API build succeeds.
- [x] Core end-to-end learning workflow smoke test succeeds.
- [x] Cross-account ownership/security smoke test succeeds.
- [x] Learner access to admin-only endpoints is denied.
- [x] Unknown API routes return a consistent JSON 404 response.
- [x] Admin authorization verifies the current database role instead of trusting only the JWT role claim.

## Accessibility and interaction gates

- [x] Global keyboard focus-visible treatment is present.
- [x] Skip-to-main-content navigation is available.
- [x] Reduced-motion preference disables non-essential animation.
- [ ] Keyboard-only browser pass for authentication, Today, Focus Mode, Review Queue, Mastery, Career and Admin surfaces.
- [ ] Screen-reader landmark/label spot check on public auth pages and authenticated workspace.

## Responsive browser UAT

Test the current `dev` deployment at minimum at:

- [ ] 360–390 px mobile width.
- [ ] 768 px tablet width.
- [ ] 1366 px desktop width.
- [ ] 1920 px desktop width.
- [ ] Light mode.
- [ ] Dark mode.

Critical flows:

- [ ] Register → onboarding → first plan.
- [ ] Today → Focus Mode → pause → refresh → resume → complete.
- [ ] Review Queue → confidence/recall → checkpoint → Mastery.
- [ ] Career readiness → Job matching → Applications → interview prep.
- [ ] Offer comparison → career outcome → learning brief.
- [ ] Public progress share → signed-out view → revoke.
- [ ] Admin system health and billing/entitlement routes as admin.
- [ ] Learner receives 403/hidden navigation for admin-only functionality.

## Deployed-service gates

- [ ] Netlify `dev`/preview deployment serves all lazy routes on hard refresh.
- [ ] Render API `/health` returns `200`.
- [ ] MongoDB connectivity confirmed from System Health.
- [ ] Redis/BullMQ configured and AI plan queue tested across API restart.
- [ ] AI provider generation tested from deployed app.
- [ ] Paystack test checkout/webhook path spot checked if billing is enabled.
- [ ] Email remains pilot-only while using `onboarding@resend.dev`; lack of arbitrary-recipient delivery is accepted for this release candidate.

## Release process

1. Freeze feature work on `dev`.
2. Complete all unchecked browser/deployed-service gates above.
3. Confirm exact UI and API `dev` heads have green CI/smoke workflows.
4. Compare `main...dev` and confirm neither repo is behind `main`.
5. Create release PRs from `dev` → `main` for UI and API.
6. Review the accumulated diff and release notes.
7. Merge API first, verify Render deployment and health.
8. Merge UI second, verify Netlify deployment and critical signed-in/signed-out routes.
9. Run a post-deploy smoke pass.
10. Sync the resulting `main` merge commits back into `dev` before starting the next development phase.

## Rollback rule

If a release-blocking regression appears after deployment, revert the release merge rather than stacking unrelated fixes directly on `main`. Fix on `dev`, rerun the gates, and release again.
