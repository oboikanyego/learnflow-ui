# Admin user management

Administration → Entitlements now acts as the User management workspace.

Admins can review user presence, monthly AI usage, subscription progress, last activity, inactivity age, and cleanup eligibility in one responsive table. Entitlement changes remain available from the Manage action.

Inactive-account cleanup is policy-driven by `ACCOUNT_INACTIVE_CLEANUP_DAYS` in System Limits (default 90 days). Cleanup is only enabled for eligible learner accounts, never admin accounts, and requires both a reason and explicit confirmation. The API permanently removes the user and owned application data and records the administrative cleanup action.

Online presence means the account has made an authenticated request in the previous five minutes. `lastSeenAt` is updated by the API authentication middleware.
