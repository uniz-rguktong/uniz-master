---
description: No-Maintenance Self-Healing Architecture Principles
---

# Self-Healing & No-Maintenance Engineering

As this project will transition to minimal or no software maintenance after the original developer graduates, all future modifications must follow these "Self-Healing" principles.

## Core Principles

1. **Stale State Recovery**: Services must never assume that an external state (like a "Pending" flag in another service) is correct. Whenever a user interacts with a system, the system should proactively verify and clean up its own stale records.
   - _Example_: When creating a new outpass, the system proactively checks for and expires past-due requests for that specific student, rather than waiting for a cron job.

2. **Atomic Invalidation**: When an action in Service A depends on status in Service B, Service A should have "Self-Healing" logic to clear stuck flags in Service B if it detects a mismatch.

3. **Background Auditing (The Janitor Pattern)**: Every microservice should have a "Deep Cleanup" task in its cron/maintenance job. This task should search for inconsistent states across the system and fix them automatically.
   - _Example_: The cron service searches for all students marked as "Pending" in the Profile Service and verifies if they actually have an active request in the Outpass Service. If not, it clears the flag.

4. **Fault-Tolerant Defaults**: If an internal API call (like a profile check) fails due to connectivity, the system should fail-open with safe defaults where appropriate, rather than blocking the user.

5. **No Hardcoded Dependencies**: Use service names (Kubernetes DNS) for all inter-service communication to ensure the system survives IP changes or environment migrations.

## Implementation Guide

### For the AI Agent (Antigravity)

- When adding a new feature, ask: "What happens if a user starts this and then disappears or their session expires?"
- Always implement a `recoverStaleState()` or similar logic at the entry point of sensitive operations.
- Avoid persistent flags that only clear on "Success". Add a timeout-based or "Janitor" based clearing mechanism.

### Critical Recovery Points

- **Login**: (Auth Service) Should verify account status.
- **Outpass/Outing**: (Outpass Service) Must clear `isApplicationPending` if the request is older than its end-date.
- **Attendance**: (Academics Service) Must handle missing records by assuming the student was present unless proven otherwise (or vice-versa, depending on policy).
