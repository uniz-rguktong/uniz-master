# UniZ Cron Service (Deprecated — Storage Cleanup Only)

> **Maintenance jobs moved to `uniz-outpass`** (`src/jobs/maintenance.ts`, `GET /api/cron`).

This service now exists only for **VPS storage cleanup** used by the K8s `uniz-storage-cleanup-job` (`runStorageCleanup` in `src/utils/storage.ts`).

Do not add new features here. New scheduled work belongs in:

- **Domain jobs** → the owning service (e.g. outpass maintenance)
- **Cross-cutting workers** → future `uniz-worker` package (see `docs/REFINEMENT.md`)
