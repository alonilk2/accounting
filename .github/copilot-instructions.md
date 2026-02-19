# Copilot Instructions (Stabilization-First)

## 1) Purpose & Source of Truth
This file is the primary implementation guide for ongoing development in this repository.

Rules:
- Treat the current workspace code as the source of truth.
- Use older docs as supporting context only.
- If a documented rule conflicts with running code behavior, follow this file and open a migration task.

## 2) Current Reality (Do Not Assume)
Current known state:
- Frontend build is not fully green (`npm run build` has TypeScript errors).
- Frontend tests are not fully green (`npm run test -- --run` has failures, mainly layout expectations).
- Backend build can fail if `backend.exe` is running and locking files.
- API response shapes are mixed (`ApiResponse<T>` in some endpoints, raw `Ok(...)` in others).
- Auth and tenant enforcement are partial in some controllers/services (dev fallbacks exist, including default company/user behavior and anonymous allowances).
- Backend service organization is inconsistent in places (legacy patterns and duplicate-like service naming across domains).
- Frontend API layer is split (`axios` shared client + `fetch` services + additional axios clients with inconsistent base URLs).
- UI tables use both `DataGrid` and `Table` depending on context; this is accepted until migration is complete.

## 3) Non-Negotiable Rules
- Do not merge new features while frontend build or critical tests are red unless the PR is explicitly labeled as a stabilization fix.
- Do not add new backend endpoint logic without tenant scoping and authenticated user context.
- Do not add a new backend service without DI registration in the central registration location.
- Do not create new frontend API calls outside the approved client layer.
- Do not introduce new dev defaults for tenant/user identity in production code paths.
- Do not silently change API contracts; document and version migration when needed.

## 4) Backend Development Contract
Controller and service requirements:
- Controllers must extract and pass tenant/user context explicitly to application services.
- Prefer `[Authorize]` by default; any anonymous endpoint must include a clear justification comment and security review note.
- New endpoints should target standardized response envelopes (`ApiResponse<T>` and paginated shape where applicable).
- Keep domain logic in services, not controllers.
- Register every new service in DI (`backend/Services/ServiceRegistration.cs` or the active registration module).
- Avoid embedding interface declarations inside implementation files for new code.

Data and migrations:
- Schema changes require EF migration files and a short rollback note in the PR description.
- Use async EF calls and cancellation tokens where supported.

## 5) Frontend Development Contract
Client and state requirements:
- Use one canonical HTTP client abstraction for new work (shared API layer in `front/src/services`).
- New API modules must not create ad hoc base URLs.
- Normalize date handling at service boundaries (ISO in/out, locale formatting only in UI).
- Keep state-management patterns consistent (follow existing store conventions; avoid new global state patterns without approval).

UI component usage:
- `DataGrid` is preferred for large tabular resource screens with sorting/filtering/pagination needs.
- `Table` is acceptable for compact, nested, print-focused, or dialog-only row views.
- MUI Grid usage must match the installed MUI v7 API (do not use deprecated v5-only patterns).

## 6) API Response & Client Contract
Canonical target contracts:
- Standard response envelope: `ApiResponse<T>` for non-streaming business endpoints.
- Standard paginated response: `PaginatedResponse<T>` with stable metadata fields (items + pagination meta).

Compatibility policy (temporary):
- Legacy raw responses remain supported only where already present.
- Any touched legacy endpoint should either:
  - be migrated to canonical contract, or
  - have an explicit compatibility adapter in frontend service code with a migration TODO.

Client parsing rules:
- Parse unknown/legacy shapes in one adapter layer, not inside UI components.
- UI components consume normalized typed models only.

## 7) Auth & Tenant Isolation Rules
- Tenant identity must be derived from authenticated context or an explicit validated source.
- Reject or fail-safe requests when tenant context is missing; do not default silently to tenant `1` in production paths.
- User attribution must use authenticated identity; avoid `"system"` fallback except approved background jobs.
- Service methods handling tenant data must receive tenant context explicitly.
- Any temporary exception must be documented with owner and removal milestone.

## 8) AI / Interactive / Tax Modules Rules
AI assistant and interactive workflows:
- Keep function-calling routes explicit and auditable.
- Validate and sanitize tool/function inputs before execution.
- Persist interactive message history through approved services, not direct controller-side shaping.

Tax and compliance modules:
- Keep Form 6111 / Israeli tax logic isolated in dedicated services.
- Do not bypass compliance validations for convenience paths.
- Any tax calculation change requires regression tests and a short compliance impact note.

## 9) Testing & Quality Gates
Minimum pre-merge gates for feature PRs:
- `front`: `npm run build`
- `front`: `npm run test -- --run`
- `backend`: `dotnet build backend.csproj`
- Smoke check: open affected screens, execute affected endpoint flows, verify no auth/tenant leakage.

Stabilization policy:
- If a gate is already failing on mainline, PRs must not increase failure scope.
- PRs touching failing areas should include at least one reduction in existing failures when feasible.

## 10) Priority Roadmap (Stabilize First)
Execution order:
1. Restore green builds and test baseline (frontend first, backend lock/build reliability included).
2. Unify API response contracts and frontend client adapters.
3. Harden auth and tenant isolation across controllers/services.
4. Resume feature expansion only after 1-3 are trending stable.

## 11) Definition of Done
Every PR is done only if:
- Build/test gates for changed layers are run and reported.
- New backend endpoints follow tenant/auth and response contract rules.
- New frontend API usage goes through canonical client/adapter layer.
- No new dev fallback identity or tenant defaults are introduced.
- Docs are updated when contracts or workflows change.
- Migration TODOs (if any) are explicit and traceable.

## 12) Reference Map
Use these repository docs intentionally:
- `README.md` -> `implementation` (setup, architecture overview, practical usage).
- `.github/AI_Accounting_SaaS_Project.md` -> `vision` (product scope and long-term direction).
- `.github/architecture-patterns.md` -> `implementation` (coding patterns; apply when consistent with current runtime).
- `.github/INTERACTIVE_MESSAGES_GUIDE.md` -> `reference` (interactive messaging behavior and patterns).
- `.github/ISRAELI_TAX_COMPLIANCE_IMPLEMENTATION.md` -> `reference` (compliance-specific details and constraints).
- `.github/ui-design-system.md` -> `reference` (UI consistency and component usage guidance).

When conflicts exist:
- Prefer this file for implementation decisions.
- Open migration tasks to align older docs with current working standards.
