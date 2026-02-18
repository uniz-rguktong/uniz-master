# UniZ - University Management System

This repository serves as the Master Vault for the UniZ ecosystem, consolidating all microservices and infrastructure components into a single management point.

## Repository Structure

The codebase is organized into functional divisions to ensure modularity and ease of maintenance:

- **apps/**: Contains individual microservice repositories, including Auth, User, Academics, Outpass, Mail, and the Portal Frontend.
- **infra/**: Contains the core infrastructure configurations, including Kubernetes manifests and Docker orchestration logic.
- **scripts/**: Centralized automation scripts for synchronization, development, and system maintenance.
- **docs/**: Technical specifications, architecture blueprints, and performance reports.
- **tests/**: Global integration and end-to-end testing suites.

## Multi-Repo Synchronization

UniZ utilizes a proprietary synchronization model that allows individual microservices to maintain their own repositories while being centrally managed within this vault.

### Command Reference

- **npm install**: Installs dependencies for the root and all sub-modules.
- **npm run push**: Synchronizes changes from the vault to individual service repositories and the main vault.
- **npm run pull**: Retrieves the latest updates from all individual service repositories.
- **npm run dev**: Initializes the local microservices development environment.
- **npm test**: Executes the comprehensive end-to-end integration suite.

## Security and Compliance

Access to this repository and its contents is strictly limited to authorized personnel. All environment configurations and sensitive data are managed within this private ecosystem to ensure maximum security.

---

Performance Certified for Production Deployment.
Corporate Technical Infrastructure.
