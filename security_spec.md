# FoundIt Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Master Source of Truth

1. **Default-Deny Global Posture**: Any path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **PII Isolation (`/users/{userId}`)**: Student and administrator profiles contain university email addresses and student IDs. Read (`get`, `list`) and write (`create`, `update`) access is strictly isolated to `isOwner(userId)` or `isAdmin()`. Self-assigned privilege escalation (`role == 'admin'`) is forbidden unless `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` is true.
3. **Trusted Admin Registry (`/admins/{adminId}`)**: Admin status is determined via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or verified runtime owner email (`request.auth.token.email_verified == true && request.auth.token.email == 'soukaryo.here@gmail.com'`).
4. **Campus Directory Items (`/items/{itemId}`)**:
   - Every item must pass `isValidCampusItem(incoming())` on both `create` and `update`.
   - `reporterId` must equal `request.auth.uid` on `create` and remain immutable on `update`.
   - `createdAt` must equal `request.time` on `create` and remain immutable on `update`; `updatedAt` must equal `request.time`.
   - Terminal states (`resolved`, `rejected`) lock non-admin updates.
   - `allow list` enforces `resource.data.visibility == 'campus'` or `resource.data.reporterId == request.auth.uid` to prevent unguarded blanket reads.
5. **Item Claims (`/claims/{claimId}`)**:
   - A claim cannot be created unless the parent item `/items/$(incoming().itemId)` exists (`exists(...)`).
   - `claimantId` must equal `request.auth.uid` on `create` and remain immutable on `update`.
   - Students can only read (`get`, `list`) their own claims (`resource.data.claimantId == request.auth.uid`); administrators can read and moderate all claims.
   - Terminal states (`approved`, `rejected`) lock non-admin updates.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Unauthenticated Item Injection**: `auth = null`, creating `/items/item_1`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 — Shadow Field Injection on Item Create**: Authenticated user creates `/items/item_1` with extra ghost field `isVerified: true`. Expected: `PERMISSION_DENIED` via `hasOnly()`.
3. **Payload 3 — Identity Spoofing on Item Create**: Authenticated user `user_a` creates `/items/item_1` with `reporterId: "user_b"`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 — Self-Assigned Admin Role on User Profile**: Authenticated user `user_a` creates `/users/user_a` with `role: "admin"` without an entry in `/admins/user_a`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 — PII Horizontal Privilege Escalation**: Authenticated user `user_b` attempts `get` on `/users/user_a`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 — Unverified Email Spoofing**: User with `email: "soukaryo.here@gmail.com"` and `email_verified: false` attempts admin delete on `/items/item_1`. Expected: `PERMISSION_DENIED`.
7. **Payload 7 — ID Poisoning Attack**: Authenticated user creates `/items/invalid$id!@#` with illegal path characters. Expected: `PERMISSION_DENIED` via `isValidId()`.
8. **Payload 8 — Denial-of-Wallet Oversized String**: Authenticated user creates `/items/item_1` with a 5,000-character `description` (exceeding `maxLength: 1000`). Expected: `PERMISSION_DENIED`.
9. **Payload 9 — Orphaned Claim Creation**: Authenticated user creates `/claims/claim_1` referencing a non-existent `itemId: "missing_item"`. Expected: `PERMISSION_DENIED` via `exists()`.
10. **Payload 10 — Unauthorized Claim Approval by Student**: Student claimant attempts to update `/claims/claim_1` `status` from `"pending"` to `"approved"`. Expected: `PERMISSION_DENIED`.
11. **Payload 11 — Terminal State Mutation**: Reporter attempts to update `/items/item_resolved` after its `status` is already `"resolved"`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 — Client Timestamp Forgery**: Authenticated user creates `/items/item_1` with a forged past `createdAt` timestamp instead of `request.time`. Expected: `PERMISSION_DENIED`.
