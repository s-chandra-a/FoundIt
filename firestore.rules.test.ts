/**
 * FoundIt Firestore Security Rules Test Suite
 * Verifies the "Dirty Dozen" adversarial payloads defined in security_spec.md
 * return PERMISSION_DENIED under zero-trust evaluation.
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unauthenticated Item Injection',
    operation: 'create',
    path: '/items/item_1',
    auth: null,
    payload: { id: 'item_1', title: 'Lost Wallet' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Item Create',
    operation: 'create',
    path: '/items/item_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      id: 'item_1',
      type: 'found',
      title: 'Calculator',
      category: 'Electronics',
      location: 'Science Hall',
      dateOccurred: '2026-10-30',
      description: 'TI-84 graphing calculator found on desk',
      imageDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      imageHash: '8f3e7c1a9b2d4e60',
      status: 'pending_approval',
      reporterId: 'user_a',
      reporterName: 'Alex Rivera',
      visibility: 'campus',
      isVerified: true, // Ghost field rejected by hasOnly()
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Item Create',
    operation: 'create',
    path: '/items/item_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      id: 'item_1',
      reporterId: 'user_b', // Mismatched UID
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Self-Assigned Admin Role on User Profile',
    operation: 'create',
    path: '/users/user_a',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      uid: 'user_a',
      email: 'student@stanford.edu',
      displayName: 'Alex Rivera',
      department: 'Computer Science',
      studentId: 'CS-2026-104',
      role: 'admin', // Forbidden without /admins/user_a record
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Horizontal Privilege Escalation',
    operation: 'get',
    path: '/users/user_a',
    auth: { uid: 'user_b', email: 'other@stanford.edu', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Unverified Email Spoofing',
    operation: 'delete',
    path: '/items/item_1',
    auth: { uid: 'spoof_uid', email: 'soukaryo.here@gmail.com', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/items/invalid$id!@#',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: { id: 'invalid$id!@#' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Denial-of-Wallet Oversized String',
    operation: 'create',
    path: '/items/item_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      id: 'item_1',
      description: 'X'.repeat(5000), // Exceeds 1000 max length
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Orphaned Claim Creation',
    operation: 'create',
    path: '/claims/claim_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      id: 'claim_1',
      itemId: 'non_existent_item_999',
      claimantId: 'user_a',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized Claim Approval by Student',
    operation: 'update',
    path: '/claims/claim_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      status: 'approved', // Only admin can change status to approved
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Mutation',
    operation: 'update',
    path: '/items/item_resolved',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      title: 'Mutating a resolved item',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/items/item_1',
    auth: { uid: 'user_a', email: 'student@stanford.edu', email_verified: true },
    payload: {
      id: 'item_1',
      createdAt: '2020-01-01T00:00:00Z', // Not request.time
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
