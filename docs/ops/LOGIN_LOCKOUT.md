# Login lockout

Failed logins are counted in Redis per campus ID and per IP. With `RATE_LIMIT_MODE=enforce`, the ID is locked for 15 minutes after 5 failures. The default `observe` mode only counts. `ENFORCE_PASSWORD_CHANGE` stays off until it is set to `true`.

To unlock an ID before the window ends, delete `auth:login:lockout:id:<id>` (the id is lowercase). Waiting 15 minutes clears it on its own. IP counters live at `auth:login:fail:ip:<ip>` and do not lock the campus NAT.

`LOAD_TEST_*` accounts are exempt from the lockout and from the forced password change so synthetic load tests can run. Do not give that prefix to a real student, and do not edit production passwords to make a test pass.
