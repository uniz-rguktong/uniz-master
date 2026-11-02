# Foundation (live)

Shared pieces every new module uses. No module logic lives here.

- Flags: `FEATURE_<MODULE>` in `@uniz/shared` (`isFeatureEnabled`, `getFeatureFlags`). All default on. `FEATURE_OUTPASS` is parked and always off. Portal mirror: `VITE_FEATURE_<MODULE>` via `src/lib/flags.ts` (`isModuleEnabled`, `moduleNavFor`).
- Payments: `PaymentProvider` interface (`createOrder`, `verifySignature`, `handleWebhook`). `getPaymentProvider()` always returns `ComingSoonProvider` for now, which returns `{ disabled: true, reason: "Payments coming soon" }`. No payment gateway is called.
- SMS: `new SmsSender(env, transport).send()` returns `{ disabled: true, reason: "SMS alerts not configured" }` when `SMS_API_KEY` or a transport is missing. AWS SNS adapter comes later as a transport.
- Email: reuse the existing notifications mailer (SMTP already set). No new mailer here.
- UI: `<ModulePage>` and `<DisabledState reason="...">` in `apps/uniz-portal/src/components/module-shell`.
- Gateway: `apps/uniz-gateway/src/module-registry.ts` holds module route stubs filtered by flag. Empty until module PRs land.

Keys (names only, all optional): `FEATURE_<MODULE>`, SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID (pending AWS SNS).
