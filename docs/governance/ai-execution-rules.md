# AI Execution Rules

## Required Behavior
- Read the phase page top-to-bottom before code.
- Follow file paths exactly.
- Do not invent new architecture.
- Do not add features outside MVP.
- Stop on missing secrets; ask the owner.
- Use stubs for optional providers (donations, email, captcha).
- Never write secrets to docs/Notion/Git.
- After each step run CI scripts locally.

## Forbidden Behavior
- Direct AI provider calls outside `@lifeos/ai` (note: `@lifeos/ai` will be created in Phase 06; until then any import of `openai` / `@anthropic-ai/sdk` / `@google/generative-ai` in any package is forbidden and `scripts/check-no-ai-direct-provider.ts` MUST fail CI on it).
- Vault content in prompts.
- SQL in route handlers.
- UI before design approval.
- Feature creep.
- Renaming a Global Convention without an ADR.
