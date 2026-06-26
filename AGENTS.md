# AGENTS.md

## Project
This project is a local, human-supervised job application autofiller. Build for a minimal v1 that uses a visible browser, saved profile data, user prompts for uncertain fields, and remembered answers for reuse.

## Scope
In scope:
- visible browser automation
- profile-based autofill
- ambiguity prompts in the local UI
- learned-answer reuse
- step-by-step progress with human review

Out of scope:
- autonomous final submission
- AI-generated answers for open-ended questions
- CAPTCHA or anti-bot bypass
- hidden background automation

## Rules
- Prefer small, reviewable changes.
- Keep server, client, and shared responsibilities separate.
- Prefer prompting over guessing.
- Do not implement auto-submit in v1.
- Treat profile data, resumes, learned answers, and logs as sensitive.
- Do not log unnecessary personal information.
- Avoid unrelated refactors unless explicitly requested.
- Do not add dependencies without clear justification.

## Code Expectations
- Use clear names that match the product domain.
- Keep functions focused and modules cohesive.
- Prefer explicit types and avoid `any`.
- Keep side effects at boundaries.
- Use parameterized database queries only.
- Use stable, user-facing browser locators when possible.
- Do not rely on arbitrary sleeps when waiting for page changes.

## Testing
- Add or update tests for behavior changes.
- Prioritize matching logic, prompt flow, persistence, and stop-before-submit behavior.
- Report what was tested and any remaining gaps.

## Documentation
- Keep the README aligned with actual behavior.
- Update planning and tracking docs when work changes scope or status.
- Document meaningful architectural decisions.

## When Unsure
Choose the safer, more observable behavior. If confidence is low, pause and ask instead of guessing.
