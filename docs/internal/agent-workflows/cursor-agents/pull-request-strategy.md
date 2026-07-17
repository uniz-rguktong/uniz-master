---
description: Pull Request and Deployment Strategy
---

# Pull Request and Deployment Strategy

To ensure stability in production and avoid unintended downtime from automatic deployments on the `main` branch, all standard tasks, new features, and bug fixes must follow the PR (Pull Request) methodology.

1. **Never push directly to `main`** for routine changes, as this will trigger the production CI/CD pipeline.
2. **Branch Naming**: Create a new branch for your work (e.g., `feature/xyz`, `bugfix/abc`, `chore/def`).
3. **Commit and Push**: Commit your changes to the new branch and push it to the remote repository.
4. **Create a Pull Request**: Open a PR against the `main` branch.
5. **Review and Merge**: Merge the PR into `main` **ONLY** when the changes are completely verified and are explicitly ready to be deployed to the live production environment.
6. **Automatic Deployment**: Once merged into `main`, the CI/CD pipeline (`deploy.yml`) will automatically build, detect changes seamlessly based on the `[rebuild all]` or cumulative SHA technique, and safely deploy the updates to the VPS.
