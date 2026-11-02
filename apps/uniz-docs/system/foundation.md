# Foundation (live)

Shared pieces every new module uses. No module logic lives here.

- Flags: `FEATURE_<MODULE>` in `@uniz/shared` (`isFeatureEnabled`, `getFeatureFlags`). All default on. `FEATURE_OUTPASS` is parked and always off. Portal mirror: `VITE_FEATURE_<MODULE>` via `src/lib/flags.ts` (`isModuleEnabled`, `moduleNavFor`).
- Payments: `getPaymentProvider()` returns `RazorpayTestProvider` when `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` are set and `PAYMENTS_MODE` is `test` or `live`. Otherwise `ComingSoonProvider`, which returns `{ disabled: true, reason: "Payments coming soon" }`. Methods: `createOrder`, `verifySignature`, `handleWebhook`.
- SMS: `new SmsSender().send()` returns `{ disabled: true, reason: "SMS alerts not configured" }` when `SMS_API_KEY` is missing.
- UI: `<ModulePage>` and `<DisabledState reason="...">` in `apps/uniz-portal/src/components/module-shell`.
- Gateway: `apps/uniz-gateway/src/module-registry.ts` holds module route stubs filtered by flag. Empty until module PRs land.

Keys (names only): FEATURE_<MODULE>, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, PAYMENTS_MODE, SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID.
