# Refactor Placements Module (Batch 2: Operations)

## Goal
Migrate Placement logic to `PlacementService`. Ensure strict RBAC, relationship validation transparency, and proper audit logging.

## Proposed Changes

### [NEW] `lib/services/placement.service.ts`
- **create**: 
    - Validate `Requirement`, `Candidate`, `Company` existence.
    - **Critical Check**: Ensure Candidate is linked to Requirement.
    - **Critical Check**: Ensure Company matches Requirement's company.
    - Check for duplicates (Candidate + Requirement uniqueness).
    - Create Placement.
    - Audit Log.
- **updateStatus**:
    - Manage status transitions (OFFERED -> JOINED -> PAID etc).
    - Update `joiningDate` if status is JOINED.
    - Update `backoutReason` if status is BACKED_OUT.
    - Update `paymentReceivedAt` if status is PAID.
    - Audit Log.
- **getAll**:
    - Filter by `status`, `companyId`, `requirementId`.
    - **Optimize**: Efficiently populate `Requirement`, `Candidate`, `Company` details (using `Promise.all` or `populate` if simplified, currently manual aggregation in action).
    - Return serialized data.
- **getById**:
    - Fetch single placement.
    - Populate all relations.
- **delete**:
    - **Permission**: Admin/Coordinator only.
    - **Action**: Hard Delete (per existing business logic).
    - Audit Log (storing old value).

### [MODIFY] `lib/actions/module8-placement.ts`
- **createPlacementAction**: Delegate to `PlacementService.create`. Use `createProtectedAction`.
- **updatePlacementStatusAction**: Delegate to `PlacementService.updateStatus`.
- **getPlacements**: Delegate to `PlacementService.getAll`.
- **getPlacementById**: Delegate to `PlacementService.getById`.
- **deletePlacement**: Delegate to `PlacementService.delete`.

## Key Logic to Preserve
1.  **Relationship Integrity**: strict checks that Candidate belongs to Requirement, and Requirement belongs to Company.
2.  **Duplicate Prevention**: Unique index on `requirementId` + `candidateId`.
3.  **Hard Delete**: Currently configured as hard delete in `deletePlacement`. `Placement` model has no `deletedAt`. We will preserve this behavior.
4.  **RBAC**: strictly filtered by role and ownership (using `allow` helper logic, integrated into Service or Action).

## Verification
- Lint check.
- Verify imports.
- TypeScript compiler check.
