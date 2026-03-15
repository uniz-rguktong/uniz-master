# Persistent System Intelligence

## Strict Rules & Constraints

### 1. Branch Management
- **NO MERGING ORNATE TO MAIN**: Under no circumstances should the `ornate` branch be merged into `main`. The `ornate` branch is strictly isolated for the Ornate project and must never pollute the `main` UniZ codebase.
- **NO PR SUGGESTIONS**: Do not suggest, consider, or ask for a Pull Request to merge changes from `ornate` to `main`. Treat them as separate universes.

### 2. Service Isolation
- **Branch-Specific Deployments**: When working on the `ornate` branch, ensure that ONLY Ornate-specific services (`ornate`, `ornate-core`) are targetted. The deployment scripts on this branch are pruned to ignore standard UniZ services.
- **Shared Secrets**: While secrets are shared for infrastructure convenience, they must be managed carefully to avoid side effects on unrelated services.
