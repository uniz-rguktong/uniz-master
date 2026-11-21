# Adminer (emergency database login)

The in-portal Database screen is the normal way to fix a row. Adminer is the fallback when that screen cannot do the job. It keeps its own username and password prompt. Cloudflare Access is a second gate in front of it.

## What is already set in Cloudflare Access

The Access application for `dbadmin.rguktong.in` exists:

| Setting | Value |
|---|---|
| Login | One-time PIN |
| Allow | `webadmin@rguktong.ac.in` only |
| Session | 8 hours |
| Team domain | `sweet-frost-287a.cloudflareaccess.com` |
| Application AUD | `f7f85a6370a5369a98b00fa3cdd47fe5d487317bad36bc70a52df6984e2f4ba0` |

The team domain and AUD are public. They live in the ConfigMap `uniz-adminer-access`, not in a secret. Do not put the database password in that ConfigMap.

A visitor who passes Access still has to log in to Adminer. Do not turn on an Adminer plugin that skips that form.

## Expected routing

This follows `api-uniz.rguktong.in`. Cloudflare terminates the public TLS. The tunnel hostname is `dbadmin.rguktong.in` (in `HOSTS` in `scripts/deploy/setup-cloudflare-tunnel.sh`), and its origin is `https://127.0.0.1:443` with TLS verification off. A separate `uniz-adminer-tls` certificate is not part of this path.

1. The record must stay proxied (orange cloud). A grey-cloud record never receives a `Cf-Access-Jwt-Assertion` header, and the sidecar then refuses every request.
2. Tunnel ingress sends `dbadmin.rguktong.in` to `https://127.0.0.1:443`. Deploy adds that rule when the Cloudflare API token can read the tunnel, and the local cloudflared config includes the same host.
3. Host nginx (`scripts/deploy/ensure-nginx-dbadmin.sh`) answers that hop with the origin certificate already used for `api-uniz` (`/etc/nginx/uniz-k8s-tls`, from Secret `uniz-tls-cert`). It proxies to Traefik at `https://127.0.0.1:30620` and keeps `Host` and `Cf-Access-Jwt-Assertion`. If that shared certificate is not on disk yet, the script warns and deploy continues.
4. Ingress `uniz-adminer` uses the same `uniz-tls-cert` so Traefik accepts the HTTPS hop, and sends the request to Service `uniz-adminer` port 8080.
5. That port is the access proxy, not Adminer. The proxy checks `Cf-Access-Jwt-Assertion` against `https://sweet-frost-287a.cloudflareaccess.com/cdn-cgi/access/certs`, issuer `https://sweet-frost-287a.cloudflareaccess.com`, and audience `f7f85a6370a5369a98b00fa3cdd47fe5d487317bad36bc70a52df6984e2f4ba0`. A missing or invalid token gets `401`. Adminer is only reached on `127.0.0.1:8080` inside the pod.

```text
browser
  → Cloudflare Access (one-time PIN, webadmin@rguktong.ac.in)
  → tunnel CNAME for dbadmin.rguktong.in
  → cloudflared → host nginx :443 (shared origin cert)
  → Traefik :30620
  → Ingress uniz-adminer
  → access proxy (Cf-Access-Jwt-Assertion for that AUD)
  → Adminer login (user uniz_dbadmin)
```

Confirm Access is in front: a logged-out browser must see the Cloudflare PIN page, not the Adminer form. Then confirm a request without the Access header is refused. From the VPS, this should be `401`:

```bash
curl -sk --resolve dbadmin.rguktong.in:443:127.0.0.1 https://dbadmin.rguktong.in/
```

## Adminer login

Server is prefilled as `10.42.0.1` (host Postgres via cni0). Type the rest yourself:

| Field | Value |
|---|---|
| System | PostgreSQL |
| Username | `uniz_dbadmin` |
| Password | vault key `DBADMIN_DB_PASSWORD` |
| Database | `uniz_db` |

The login is not a superuser. After signing in, this should show `f` for both flags:

```sql
SELECT rolsuper, rolcreaterole
FROM pg_roles
WHERE rolname = current_user;
```

The role can `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on application tables, and `USAGE` on schemas and sequences. It cannot create roles, and it is not granted `CREATE` on schemas (no tables, views, or other DDL). History tables `uniz_dbadmin.changes` and `uniz_dbadmin.requests` allow insert and read only. Triggers reject updates, deletes, and truncates.

## Create the login

Deploy fills `DBADMIN_DB_PASSWORD` in `/root/uniz-secrets.env` when that line is missing or empty. It generates the value on the VPS, or stores the Actions secret of the same name when that secret is set. The file stays mode 600 and the owner is left as it was. The deploy log says `present` or `generated DBADMIN_DB_PASSWORD (new)` and does not print the value. A vault that already has a password and is missing `DBADMIN_DB_PASSWORD_VERSION=2` (or has an older marker) is rotated once to a new random password. Later deploys leave that pair alone and re-apply it with `ALTER ROLE`.

That step runs before the vault is copied into Secret `uniz-secrets`. The same deploy then starts a job from CronJob `uniz-dbadmin-role`, which creates `uniz_dbadmin` or `ALTER`s its password, and restarts `uniz-dbadmin-service` and Adminer when the password was just written.

The other two names are optional. If the vault is ever regenerated from GitHub Actions, set them as Actions secrets first or the rendered file will contain empty values. Do not commit any of these values.

| Key | Required | Purpose |
|---|---|---|
| `DBADMIN_DB_PASSWORD` | yes | Password for role `uniz_dbadmin` |
| `DBADMIN_BOOTSTRAP_DATABASE_URL` | no | Owner URL used only to create the role. Defaults to `USER_DATABASE_URL` |
| `DBADMIN_MIGRATE_DATABASE_URL` | no | Owner URL for the audit migration. Defaults to `USER_DATABASE_URL` with `schema=uniz_dbadmin` |

The bootstrap user must be allowed to `CREATE ROLE`. If `USER_DATABASE_URL` cannot, set `DBADMIN_BOOTSTRAP_DATABASE_URL` to a superuser URL.

To do the same by hand:

```bash
bash scripts/deploy/sync-k8s-secret-from-vault.sh
bash scripts/deploy/prisma-migrate-deploy-all.sh
kubectl create job --from=cronjob/uniz-dbadmin-role uniz-dbadmin-role-manual
```

`infra/kubernetes/base/core/dbadmin-role/ensure-dbadmin-role.sh` does the same grants when `psql` is on the machine. It is safe to run again. Deploy also starts a one-off job from CronJob `uniz-dbadmin-role` after applying manifests, and the CronJob repeats the grants at 02:15 so tables added later stay covered.

Migration: `20261121120000_dbadmin_audit` in `apps/uniz-dbadmin`. It creates schema `uniz_dbadmin` and the history tables.

## In-portal editor

The Database item is on the webadmin screen only. The API is `GET/POST /api/v1/dbadmin/*` on the gateway, served by `uniz-dbadmin-service`. The service checks the portal JWT and allows only the account `webadmin@rguktong.ac.in`. It connects as `uniz_dbadmin`, so a request cannot do more than that login can.

Every row change runs in a transaction and is inserted into `uniz_dbadmin.changes` (who, when, table, key, before, after, SQL). History can undo an add, edit, or delete in one click. Deletes and commands that change data ask you to type `DELETE` or the command word. Requests are rate-limited and written to `uniz_dbadmin.requests`.

The service reads `DBADMIN_DB_PASSWORD` and the existing `JWT_SECURITY_KEY` from Secret `uniz-secrets`. Host, port, database name, and the Access AUD are not secrets.

## Apply

`scripts/deploy/deploy.sh` applies `infra/kubernetes/base/core`, which includes the editor, Adminer, and the grant CronJob. Image rebuilds are selected like the other services (`[rebuild dbadmin]`).

To apply only these objects (the overlay reads files from `base/core`, so it needs the relaxed load restrictor):

```bash
kubectl kustomize --load-restrictor LoadRestrictionsNone infra/kubernetes/overlays/adminer | kubectl apply -f -
```

The production overlay rewrites `uniz-dbadmin-service` to the GHCR tag. The Adminer container stays `adminer:4.8.1`.
