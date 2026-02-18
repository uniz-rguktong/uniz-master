# Git Repository Structure Update

## Summary

All microservices now have their own individual git repositories with correct remotes configured.

## Repository Mapping

| Local Directory       | Remote Repository                                        |
| --------------------- | -------------------------------------------------------- |
| `uniz-mail`           | https://github.com/uniz-rguktong/uniz-mail.git           |
| `uniz-academics`      | https://github.com/uniz-rguktong/uniz-academics.git      |
| `uniz-auth`           | https://github.com/uniz-rguktong/uniz-auth.git           |
| `uniz-user`           | https://github.com/uniz-rguktong/uniz-user.git           |
| `uniz-outpass`        | https://github.com/uniz-rguktong/uniz-outpass.git        |
| `uniz-files`          | https://github.com/uniz-rguktong/uniz-files.git          |
| `uniz-notifications`  | https://github.com/uniz-rguktong/uniz-notifications.git  |
| `uniz-cron`           | https://github.com/uniz-rguktong/uniz-cron.git           |
| `uniz-gateway`        | https://github.com/uniz-rguktong/uniz-gateway.git        |
| `uniz-infrastructure` | https://github.com/uniz-rguktong/uniz-infrastructure.git |
| **Master Vault**      | https://github.com/uniz-rguktong/uniz-master-vault.git   |

## How It Works

### 1. Individual Service Pushes

When you run `npm run push`, the script:

- Iterates through each microservice
- Commits any changes locally
- Pushes to that service's individual repository
- Triggers Vercel deployments automatically

### 2. Master Vault Sync

After all services are pushed, the script:

- Temporarily hides each service's `.git` folder
- Commits all service code to the master vault
- Pushes to `uniz-master-vault` repository
- Restores each service's `.git` folder

This gives you the best of both worlds:

- **Individual repos**: Each service can be deployed independently
- **Master vault**: All code is backed up in one place

## Scripts

### `scripts/init_service_repos.sh`

Initializes git repositories for all microservices and sets correct remotes.
Run this if you need to reinitialize the repos.

### `scripts/push_all.sh`

Main sync script that pushes all changes to individual repos and the master vault.
This is what `npm run push` and `npm run deploy` execute.

## Verification

To verify that all remotes are correct:

```bash
for service in uniz-*; do
  if [ -d "$service/.git" ]; then
    echo "$service: $(cd $service && git remote get-url origin)"
  fi
done
```

## Initial Setup (Completed 2026-02-11)

All repositories were force-pushed to synchronize with the monorepo state:

```bash
for service in uniz-mail uniz-academics uniz-outpass uniz-auth uniz-user \
               uniz-files uniz-notifications uniz-cron uniz-gateway uniz-infrastructure; do
  (cd "$service" && git push -f origin main)
done
```

✅ All 10 microservices successfully synchronized

## Notes

- Each microservice maintains its own git history
- The master vault aggregates all services for backup/archival
- Vercel deployments are triggered automatically on push to individual repos
- All repos are under the `uniz-rguktong` GitHub organization
