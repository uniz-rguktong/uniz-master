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

This follows `api-uniz.rguktong.in`. You create the DNS record. The deploy does not create it.

1. In the `rguktong.in` zone, add `dbadmin` the same way `api-uniz` is published (proxied CNAME to the tunnel, or proxied A to the VPS). The cloud must be orange. A grey-cloud record never receives a `Cf-Access-Jwt-Assertion` header, and the proxy then refuses every request.
2. If `api-uniz` is on the cloudflared tunnel, add `dbadmin.rguktong.in` to `HOSTS` in `scripts/deploy/setup-cloudflare-tunnel.sh` before the next tunnel sync. Origin stays `https://127.0.0.1:443`.
3. Host nginx (`scripts/deploy/ensure-nginx-dbadmin.sh`, also called from `scripts/deploy/deploy.sh`) listens for `dbadmin.rguktong.in` and proxies to Traefik at `https://127.0.0.1:30620`, with the `Host` and `Cf-Access-Jwt-Assertion` headers kept. That is the same hop as `scripts/deploy/ensure-nginx-api-uniz.sh`. The certificate is Secret `uniz-adminer-tls` (cert-manager, DNS-01), not the shared API certificate.
4. The Ingress `uniz-adminer` sends the request to Service `uniz-adminer` port 8080.
5. That port is the access proxy, not Adminer. The proxy checks `Cf-Access-Jwt-Assertion` against the certs at `https://sweet-frost-287a.cloudflareaccess.com/cdn-cgi/access/certs` and requires the AUD above. A missing or invalid token gets `401`. Adminer is only reached on `127.0.0.1:8080` inside the pod.

```text
browser
  → Cloudflare Access (one-time PIN, webadmin@rguktong.ac.in)
  → DNS for dbadmin.rguktong.in (you create this; same target as api-uniz, proxied)
  → host nginx :443
  → Traefik :30620
  → Ingress uniz-adminer
  → access proxy (Cf-Access-Jwt-Assertion)
  → Adminer login (user uniz_dbadmin)
```

After the certificate exists, rerun `bash scripts/deploy/ensure-nginx-dbadmin.sh` if the first deploy happened before DNS was in place.

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

Deploy fills `DBADMIN_DB_PASSWORD` in `/root/uniz-secrets.env` when that line is missing or empty. It generates the value on the VPS, or stores the Actions secret of the same name when that secret is set. The file stays mode 600 and the owner is left as it was. The deploy log says `present` or `generated DBADMIN_DB_PASSWORD (new)` and does not print the value.

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

`scripts/ops/ensure-dbadmin-role.sh` does the same grants when `psql` is on the machine. It is safe to run again. Deploy also starts a one-off job from CronJob `uniz-dbadmin-role` after applying manifests, and the CronJob repeats the grants at 02:15 so tables added later stay covered.

Migration: `20261121120000_dbadmin_audit` in `apps/uniz-dbadmin`. It creates schema `uniz_dbadmin` and the history tables.

## In-portal editor

The Database item is on the webmaster screen only. The API is `GET/POST /api/v1/dbadmin/*` on the gateway, served by `uniz-dbadmin-service`. The service checks the portal JWT and allows only `webadmin` (legacy `webmaster` tokens count as `webadmin`). It connects as `uniz_dbadmin`, so a request cannot do more than that login can.

Every row change runs in a transaction and is inserted into `uniz_dbadmin.changes` (who, when, table, key, before, after, SQL). History can undo an add, edit, or delete in one click. Deletes and commands that change data ask you to type `DELETE` or the command word. Requests are rate-limited and written to `uniz_dbadmin.requests`.

The service reads `DBADMIN_DB_PASSWORD` and the existing `JWT_SECURITY_KEY` from Secret `uniz-secrets`. Host, port, database name, and the Access AUD are not secrets.

## Apply

`scripts/deploy/deploy.sh` applies `infra/kubernetes/base/core`, which includes the editor, Adminer, and the grant CronJob. Image rebuilds are selected like the other services (`[rebuild dbadmin]`).

To apply only these objects:

```bash
kubectl apply -k infra/kubernetes/overlays/adminer
```

The production overlay rewrites `uniz-dbadmin-service` to the GHCR tag. The Adminer container stays `adminer:4.8.1`.
