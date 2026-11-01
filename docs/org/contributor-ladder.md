# Contributor ladder

How you go from your first PR to reviewing other people's code. Nothing here is automatic. A maintainer proposes the move in a Discussion and it happens if nobody objects within a week.

## 1. Contributor

Anyone with a merged PR in uniz-master.

- Pick issues, open PRs, answer questions in Discussions.
- You get listed in the README contributors section.

## 2. Triager

For people who keep showing up.

- How to get here: 3+ merged PRs, and you've helped others (reproduced a bug, answered a setup question, reviewed a PR with useful comments).
- What you do: label and close duplicate issues, reproduce bugs, write good first issues with clear files and a "done when".
- Access: Triage role on the repo. No merge rights.

## 3. Reviewer

Owns an area like the portal, academics service or docs.

- How to get here: 10+ merged PRs, most in that area, and at least 5 PR reviews that caught real problems.
- What you do: review PRs in your area within a few days, keep the area's good first issues stocked.
- Access: your handle goes on that area in `.github/CODEOWNERS`. Your approval counts as the required review there.

## 4. Maintainer

Responsible for the whole project and production.

- How to get here: reviewer for 3+ months, trusted with infra changes, and agreed by the existing maintainers.
- What you do: merge PRs, run deploys, handle security reports, make the final call when a discussion is stuck.
- Access: push to `main` and production access. Production secrets are only shared with maintainers who need them.

## Stepping back

If you're inactive for 6 months you move to emeritus and lose write or triage access. Ask in Discussions to come back, no need to start over.
