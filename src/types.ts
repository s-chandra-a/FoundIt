export type UserRole = 'student' | 'admin';

export type ItemCategory =
  | 'Electronics'
  | 'ID & Keys'
  | 'Accessories'
  | 'Books & Notes'
  | 'Apparel'
  | 'Bottles & Gear'
  | 'Other';

export type ItemType = 'found' | 'lost';

export type ItemStatus =
  | 'pending_approval'
  | 'approved'
  | 'claimed'
  | 'resolved'
  | 'rejected';

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  department: string;
  studentId: string;
  role: UserRole;
  createdAt?: unknown;
  isLocalDemoSession?: boolean;
}

export interface CampusItem {
  id: string;
  type: ItemType;
  title: string;
  category: ItemCategory;
  location: string;
  dateOccurred: string;
  description: string;
  imageDataUrl: string;
  imageHash: string;
  status: ItemStatus;
  reporterId: string;
  reporterName: string;
  visibility: 'campus';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ItemClaim {
  id: string;
  itemId: string;
  itemTitle: string;
  claimantId: string;
  claimantName: string;
  proofDescription: string;
  matchScore: number;
  status: ClaimStatus;
  adminNotes: string;
  visibility: 'campus';
  linkedLostItemId?: string;
  linkedLostItemTitle?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HashComparisonMetric {
  id: string;
  imageHash: string;
  hammingDistance: number;
  matchingBits: number;
  totalBits: number;
  matchPercentage: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  variant: 'success' | 'info' | 'warning';
}

// Blueprint Validation Constants (Verbatim from firebase-blueprint.json)
export const BLUEPRINT_CONSTRAINTS = {
  ID_MAX_LEN: 128,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  HASH_REGEX: /^[0-9a-fA-F]{16,64}$/,
  TITLE_MIN_LEN: 2,
  TITLE_MAX_LEN: 120,
  LOCATION_MIN_LEN: 2,
  LOCATION_MAX_LEN: 120,
  DESCRIPTION_MIN_LEN: 4,
  DESCRIPTION_MAX_LEN: 1000,
  PROOF_MIN_LEN: 5,
  PROOF_MAX_LEN: 1000,
  ADMIN_NOTES_MAX_LEN: 500,
  IMAGE_DATA_URL_MAX_LEN: 150000,
} as const;

export const CAMPUS_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'ID & Keys',
  'Accessories',
  'Books & Notes',
  'Apparel',
  'Bottles & Gear',
  'Other',
];

export const CAMPUS_LOCATIONS: string[] = [
  'Main University Library — 3rd Floor Study Hall',
  'Engineering & Computer Science Center — Lab 204',
  'Student Union Commons — Dining Atrium',
  'Science & Biotech Pavilion — Lecture Hall B',
  'Campus Recreation & Athletics Center',
  'Arts & Architecture Studio Building',
  'North Residence Quad — Bike Rack Plaza',
];

export const CAMPUS_DROP_LOCATIONS: string[] = [
  'Student Union Security Desk — Room 104 (Dropped off at Union Commons)',
  'Main Library Circulation Desk — Ground Floor (Dropped off at Library)',
  'Engineering Hall Reception Drop-Box — Room 110 (Dropped off at ECS Lab)',
  'Science Pavilion Security Office — East Wing (Dropped off at Lecture Hall B)',
  'Campus Recreation Front Desk — Main Lobby (Dropped off at Gym Courts)',
  'North Residence Operations Desk — Building A (Dropped off at North Quad)',
];

// Single pre-made Admin credentials with highest privileges
export const PREMADE_ADMIN_CREDENTIALS = {
  email: 'admin@foundit.edu',
  password: 'Admin@FoundIt2026',
  displayName: 'Campus Directory Chief Admin',
  department: 'University Security & Operations',
  studentId: 'ADMIN-001',
  bootstrapKey: 'FOUNDIT_CAMPUS_ADMIN_2026',
} as const;

/**
 * Validates that a student email belongs to an accredited university domain.
 */
export function isUniversityEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;
  const domain = normalized.split('@')[1] || '';
  return (
    domain.endsWith('.edu') ||
    domain.includes('.edu.') ||
    domain.includes('.ac.') ||
    domain.endsWith('university.org') ||
    domain === 'foundit.edu'
  );
}
