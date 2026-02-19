# Subscription-Gated Double-Entry Accounting Implementation Plan

## Summary
This document defines the implementation plan for enabling double-entry accounting only for companies with eligible subscription plans. The implementation will use existing company subscription fields, keep core business flows operational for non-eligible companies, and provide a complete in-product upgrade path.

## Scope
The implementation includes:
- Backend entitlement enforcement for double-entry accounting features.
- Controlled behavior for non-eligible companies: business actions continue, accounting journal creation is skipped.
- Access gating for core accounting reporting/export endpoints.
- Frontend feature gating and upgrade UX.
- No database schema migration.
- No historical backfill for transactions created before upgrade.

The implementation excludes:
- Payment-provider checkout integration.
- Automatic backfill of missing historical journal entries.
- New subscription entities at user level.

## Backend Implementation Plan
1. Centralize feature and entitlement definitions.
- Add a single source of truth for:
- Feature key: `double-entry-accounting`.
- Eligible plans: `Pro`, `Enterprise`.
- Plan normalization and unknown-plan handling.

2. Implement real entitlement logic in company service.
- Update `ICompanyService` / `CompanyService` feature checks to evaluate:
- Company exists and is active.
- Subscription is not expired.
- Subscription plan is known and eligible.
- Default policy: null/empty/unknown plans are not eligible.

3. Keep `check-feature-access` response consistent and actionable.
- Ensure `CompanyController` returns consistent reasons for denial.
- Include upgrade guidance metadata in response payload:
- `feature`.
- `currentPlan`.
- `upgradePath` (internal path: `/company-management`).

4. Enforce gating in journal creation paths.
- In `JournalEntryService`, guard each journal-creation method:
- `CreateSalesJournalEntriesAsync`.
- `CreatePaymentReceiptJournalEntriesAsync`.
- `CreatePurchaseJournalEntriesAsync`.
- `CreatePaymentMadeJournalEntriesAsync`.
- `CreateInventoryAdjustmentJournalEntriesAsync`.
- If not eligible:
- Do not throw.
- Skip journal writes.
- Log structured warning.
- Add audit event for traceability.

5. Preserve business transaction success for non-eligible companies.
- Sales, purchasing, and inventory operations should still succeed.
- Only accounting-side journal posting is skipped when not entitled.

6. Apply hard access gating for core accounting reporting/export APIs.
- Add entitlement checks and return HTTP `403` when not entitled for:
- `TaxReportingController` core accounting/tax endpoints.
- `ComplianceController` unified format export endpoint.
- Return machine-readable reason and upgrade path in error payload.

7. Observability and auditability.
- Add structured logs for skipped accounting actions:
- Company ID.
- Feature key.
- Plan.
- Denial reason.
- Add audit action marker such as `ACCOUNTING_SKIPPED`.

## Frontend Implementation Plan
1. Add feature-access hook.
- Create `useFeatureAccess` hook for:
- Calling `companyApi.checkFeatureAccess`.
- Returning `hasAccess`, `reason`, `loading`, `refresh`.
- Using company context from auth store.

2. Gate Chart of Accounts page.
- In `ChartOfAccounts.tsx`, show locked state when not entitled.
- Provide clear messaging and a primary CTA to upgrade.
- CTA navigates to `/company-management`.

3. Gate core accounting tabs in Reports page.
- In `Reports.tsx`, keep general reports visible.
- Lock accounting-specific sections:
- Unified format export.
- Form 6111 tax reporting.
- Show entitlement messaging and upgrade CTA to `/company-management`.

4. Add subscription management UX in Company Management.
- In `Company.tsx`, add/update subscription control section:
- Plan selector (`Basic`, `Pro`, `Enterprise`).
- Expiration date editor.
- Save action via `companyApi.updateCompanySubscription`.
- Success/failure feedback.

5. Keep client state synchronized after subscription updates.
- Extend auth store with action to update company object in-memory.
- Refresh feature access after subscription update to unlock UI immediately.

6. Standardize upgrade entry point.
- All locked states use the same internal upgrade target:
- `/company-management`.

## API / Interface / Type Changes
1. Backend service contracts.
- Update `ICompanyService` and `CompanyService` to expose consistent entitlement evaluation behavior for feature checks.

2. Company feature access response.
- Extend `FeatureAccessResponse` in backend DTOs with optional fields:
- `feature`.
- `currentPlan`.
- `upgradePath`.

3. Frontend type alignment.
- Update `FeatureAccessResponse` type in `front/src/services/companyApi.ts` to match backend optional fields.

4. No breaking changes.
- Existing callers of `HasFeatureAccessAsync` and `check-feature-access` remain compatible.

## Test Scenarios
1. Entitlement evaluation tests (backend).
- Company on `Basic` is denied.
- Company on `Pro` is allowed.
- Company on `Enterprise` is allowed.
- Company with null/unknown plan is denied.
- Company with expired subscription is denied.

2. Journal behavior tests (backend).
- Non-entitled company:
- Source business flow succeeds.
- No journal entries are written.
- Skip event is logged/audited.
- Entitled company:
- Journal entries are written.
- Entries remain balanced.

3. Controller access tests (backend).
- Tax reporting endpoints return `403` for non-entitled companies.
- Compliance export endpoint returns `403` for non-entitled companies.
- Entitled companies receive successful responses.

4. Frontend gating tests.
- Chart of Accounts renders locked state without entitlement.
- Reports accounting tabs are locked without entitlement.
- Locked states include upgrade CTA to `/company-management`.

5. Subscription update UX tests.
- Updating plan to `Pro`/`Enterprise` unlocks gated UI in-session.
- Downgrade or expiration re-locks gated UI.

6. Manual end-to-end verification.
- `Basic`: business operations complete, accounting journals skipped, accounting exports/reports blocked.
- `Pro/Enterprise`: full double-entry and accounting reporting/export available.

## Rollout and Monitoring
1. Rollout strategy.
- Deploy behind entitlement checks without schema changes.
- Enable immediately for existing eligible companies.

2. Monitoring signals.
- Count of `ACCOUNTING_SKIPPED` events.
- Count of `403` entitlement denials by endpoint.
- Upgrade CTA click-throughs from locked screens.

3. Operational checks after release.
- Confirm no increase in transaction failure rates for non-entitled companies.
- Confirm journal creation rates rise only for eligible plans.
- Validate denial reasons and upgrade path payloads in logs/responses.

## Assumptions and Defaults
1. Entitlement source is company-level subscription only.
2. Eligible plans are exactly `Pro` and `Enterprise`.
3. Null/unknown plan means no entitlement.
4. If not entitled, business flows are not blocked; journal creation is skipped.
5. Core accounting gate scope in phase 1:
- Journal creation.
- Tax reporting endpoints.
- Unified format export endpoint.
- Chart of Accounts UI.
6. Upgrade action is internal navigation to `/company-management`.
7. No historical backfill is performed for transactions created before entitlement.
8. No database schema changes are required.
