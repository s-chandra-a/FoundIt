import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  FilePlus2,
  Fingerprint,
  FolderCheck,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  CampusItem,
  ClaimStatus,
  ItemClaim,
  ItemStatus,
  PREMADE_ADMIN_CREDENTIALS,
  ToastNotification,
  UserProfile,
  UserRole,
} from './types';
import { buildInitialCampusItems, buildInitialSampleClaims } from './utils/seedData';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard, StudentTab } from './components/StudentDashboard';
import { AdminDashboard, AdminTab } from './components/AdminDashboard';

const LOCAL_ITEMS_KEY = 'foundit_campus_items_v2';
const LOCAL_CLAIMS_KEY = 'foundit_campus_claims_v2';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<UserRole | null>(null);

  const [studentTab, setStudentTab] = useState<StudentTab>('directory');
  const [adminTab, setAdminTab] = useState<AdminTab>('log_found');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [breadcrumbDropdownOpen, setBreadcrumbDropdownOpen] = useState<boolean>(false);
  const breadcrumbDropdownRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<CampusItem[]>([]);
  const [claims, setClaims] = useState<ItemClaim[]>([]);
  const [hasSeededOnce, setHasSeededOnce] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const handleNotify = useCallback(
    (
      title: string,
      message: string,
      variant: 'success' | 'info' | 'warning' = 'success'
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // Sync helper for cross-session persistence (localStorage + Express /api/state)
  const persistStateSnapshot = useCallback(
    async (nextItems: CampusItem[], nextClaims: ItemClaim[]) => {
      try {
        localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(nextItems));
        localStorage.setItem(LOCAL_CLAIMS_KEY, JSON.stringify(nextClaims));
      } catch {
        // Ignore storage quota warnings
      }
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: nextItems, claims: nextClaims }),
        });
      } catch {
        // Ignore network errors if offline
      }
    },
    []
  );

  // Close desktop breadcrumb #3 dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        breadcrumbDropdownRef.current &&
        !breadcrumbDropdownRef.current.contains(event.target as Node)
      ) {
        setBreadcrumbDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Listen to Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUserProfile((prev) => (prev?.isLocalDemoSession ? prev : null));
        setAuthReady(true);
        return;
      }

      try {
        const emailLower = (fbUser.email || '').toLowerCase();
        const isPremadeAdmin =
          emailLower === PREMADE_ADMIN_CREDENTIALS.email.toLowerCase();

        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile({
            uid: fbUser.uid,
            email: data.email || fbUser.email || '',
            displayName:
              data.displayName || fbUser.displayName || 'University User',
            department: data.department || 'University Campus',
            studentId: data.studentId || 'UNI-2026',
            role: isPremadeAdmin ? 'admin' : data.role || 'student',
          });
        } else {
          const defaultProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName:
              fbUser.displayName ||
              (isPremadeAdmin
                ? PREMADE_ADMIN_CREDENTIALS.displayName
                : (fbUser.email || 'Student').split('@')[0]),
            department: isPremadeAdmin
              ? PREMADE_ADMIN_CREDENTIALS.department
              : 'University Campus',
            studentId: isPremadeAdmin
              ? PREMADE_ADMIN_CREDENTIALS.studentId
              : 'STU-2026',
            role: isPremadeAdmin ? 'admin' : 'student',
          };
          setUserProfile(defaultProfile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Attach Real-Time Firestore Listeners (or Synchronized Local Demo Session State)
  useEffect(() => {
    if (!authReady || !userProfile) return;

    if (userProfile.isLocalDemoSession) {
      let mounted = true;
      (async () => {
        // Check server or localStorage first so changes persist across Student <-> Admin switches
        try {
          const res = await fetch('/api/state');
          if (res.ok) {
            const data = await res.json();
            if (
              Array.isArray(data.items) &&
              data.items.length > 0 &&
              mounted
            ) {
              setItems(data.items);
              setClaims(Array.isArray(data.claims) ? data.claims : []);
              return;
            }
          }
        } catch {
          // Fallback to localStorage
        }

        try {
          const savedItemsRaw = localStorage.getItem(LOCAL_ITEMS_KEY);
          const savedClaimsRaw = localStorage.getItem(LOCAL_CLAIMS_KEY);
          if (savedItemsRaw) {
            const parsedItems = JSON.parse(savedItemsRaw) as CampusItem[];
            const parsedClaims = savedClaimsRaw
              ? (JSON.parse(savedClaimsRaw) as ItemClaim[])
              : [];
            if (parsedItems.length > 0 && mounted) {
              setItems(parsedItems);
              setClaims(parsedClaims);
              return;
            }
          }
        } catch {
          // Fallback to fresh seed
        }

        const initialItems = await buildInitialCampusItems(
          userProfile.uid,
          userProfile.displayName
        );
        const initialClaims = buildInitialSampleClaims(
          userProfile.uid,
          'Alex Rivera'
        );
        if (!mounted) return;
        setItems(initialItems);
        setClaims(initialClaims);
        await persistStateSnapshot(initialItems, initialClaims);
      })();
      return () => {
        mounted = false;
      };
    }

    const itemsQuery = query(
      collection(db, 'items'),
      where('visibility', '==', 'campus')
    );

    const unsubItems = onSnapshot(
      itemsQuery,
      async (snapshot) => {
        const fetchedItems: CampusItem[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as CampusItem
        );
        setItems(fetchedItems);

        if (fetchedItems.length === 0 && !hasSeededOnce) {
          setHasSeededOnce(true);
          try {
            const seedItems = await buildInitialCampusItems(
              userProfile.uid,
              userProfile.displayName
            );
            for (const item of seedItems) {
              await setDoc(doc(db, 'items', item.id), {
                ...item,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            const seedClaims = buildInitialSampleClaims(
              userProfile.uid,
              'Alex Rivera'
            );
            for (const clm of seedClaims) {
              await setDoc(doc(db, 'claims', clm.id), {
                ...clm,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (seedErr) {
            console.warn('Initial seed skipped:', seedErr);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'items');
      }
    );

    const claimsQuery =
      userProfile.role === 'admin'
        ? query(collection(db, 'claims'), where('visibility', '==', 'campus'))
        : query(
            collection(db, 'claims'),
            where('claimantId', '==', userProfile.uid)
          );

    const unsubClaims = onSnapshot(
      claimsQuery,
      (snapshot) => {
        const fetchedClaims: ItemClaim[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as ItemClaim
        );
        setClaims(fetchedClaims);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'claims');
      }
    );

    return () => {
      unsubItems();
      unsubClaims();
    };
  }, [authReady, userProfile, hasSeededOnce, persistStateSnapshot]);

  // CRUD Handlers
  const handleCreateItem = async (
    newItem: Omit<CampusItem, 'createdAt' | 'updatedAt'>
  ) => {
    if (!userProfile) return;

    const itemWithTimestamp: CampusItem = {
      ...newItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (userProfile.isLocalDemoSession) {
      const nextItems = [itemWithTimestamp, ...items];
      setItems(nextItems);
      await persistStateSnapshot(nextItems, claims);
      return;
    }

    const path = `items/${newItem.id}`;
    try {
      await setDoc(doc(db, 'items', newItem.id), {
        ...newItem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleCreateClaim = async (
    newClaim: Omit<ItemClaim, 'createdAt' | 'updatedAt'>
  ) => {
    if (!userProfile) return;

    const claimWithTimestamp: ItemClaim = {
      ...newClaim,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (userProfile.isLocalDemoSession) {
      const nextClaims = [claimWithTimestamp, ...claims];
      const nextItems = items.map((it) =>
        it.id === newClaim.itemId && it.status === 'approved'
          ? { ...it, status: 'claimed' as ItemStatus }
          : it
      );
      setClaims(nextClaims);
      setItems(nextItems);
      await persistStateSnapshot(nextItems, nextClaims);
      return;
    }

    const claimPath = `claims/${newClaim.id}`;
    try {
      await setDoc(doc(db, 'claims', newClaim.id), {
        ...newClaim,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const targetItem = items.find((i) => i.id === newClaim.itemId);
      if (targetItem && targetItem.status === 'approved') {
        await updateDoc(doc(db, 'items', newClaim.itemId), {
          status: 'claimed',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, claimPath);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, status: ItemStatus) => {
    if (!userProfile) return;

    if (userProfile.isLocalDemoSession) {
      const nextItems = items.map((it) =>
        it.id === itemId ? { ...it, status } : it
      );
      setItems(nextItems);
      await persistStateSnapshot(nextItems, claims);
      return;
    }

    const path = `items/${itemId}`;
    try {
      await updateDoc(doc(db, 'items', itemId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Unresolve an item from Resolved History and restore it to the active Found Directory
  const handleUnresolveItem = async (itemId: string) => {
    if (!userProfile) return;

    const linkedApprovedClaims = claims.filter(
      (c) => c.itemId === itemId && c.status === 'approved'
    );

    if (userProfile.isLocalDemoSession) {
      const nextItems = items.map((it) =>
        it.id === itemId ? { ...it, status: 'approved' as ItemStatus } : it
      );
      const nextClaims = claims.map((c) =>
        c.itemId === itemId && c.status === 'approved'
          ? {
              ...c,
              status: 'pending' as ClaimStatus,
              adminNotes: 'Unresolved by Admin — returned to active Found Directory.',
            }
          : c
      );
      setItems(nextItems);
      setClaims(nextClaims);
      await persistStateSnapshot(nextItems, nextClaims);
      return;
    }

    const itemPath = `items/${itemId}`;
    try {
      await updateDoc(doc(db, 'items', itemId), {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });

      for (const clm of linkedApprovedClaims) {
        await updateDoc(doc(db, 'claims', clm.id), {
          status: 'pending',
          adminNotes: 'Unresolved by Admin — returned to active Found Directory.',
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, itemPath);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!userProfile) return;

    if (userProfile.isLocalDemoSession) {
      const nextItems = items.filter((it) => it.id !== itemId);
      setItems(nextItems);
      await persistStateSnapshot(nextItems, claims);
      return;
    }

    const path = `items/${itemId}`;
    try {
      await deleteDoc(doc(db, 'items', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleModerateClaim = async (
    claimId: string,
    itemId: string,
    status: ClaimStatus,
    adminNotes: string
  ) => {
    if (!userProfile) return;

    if (userProfile.isLocalDemoSession) {
      const nextClaims = claims.map((c) =>
        c.id === claimId ? { ...c, status, adminNotes } : c
      );
      const nextItems =
        status === 'approved'
          ? items.map((it) =>
              it.id === itemId ? { ...it, status: 'resolved' as ItemStatus } : it
            )
          : items;
      setClaims(nextClaims);
      setItems(nextItems);
      await persistStateSnapshot(nextItems, nextClaims);
      return;
    }

    const claimPath = `claims/${claimId}`;
    try {
      await updateDoc(doc(db, 'claims', claimId), {
        status,
        adminNotes,
        updatedAt: serverTimestamp(),
      });

      if (status === 'approved') {
        const itemExists = items.some((i) => i.id === itemId);
        if (itemExists) {
          await updateDoc(doc(db, 'items', itemId), {
            status: 'resolved',
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, claimPath);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!userProfile) return;

    if (userProfile.isLocalDemoSession) {
      const nextClaims = claims.filter((c) => c.id !== claimId);
      setClaims(nextClaims);
      await persistStateSnapshot(items, nextClaims);
      return;
    }

    const path = `claims/${claimId}`;
    try {
      await deleteDoc(doc(db, 'claims', claimId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSeedDatabase = async () => {
    if (!userProfile) return;
    const seedItems = await buildInitialCampusItems(
      userProfile.uid,
      userProfile.displayName
    );
    const seedClaims = buildInitialSampleClaims(
      userProfile.uid,
      'Alex Rivera'
    );

    if (userProfile.isLocalDemoSession) {
      setItems(seedItems);
      setClaims(seedClaims);
      await persistStateSnapshot(seedItems, seedClaims);
      return;
    }

    for (const item of seedItems) {
      const path = `items/${item.id}`;
      try {
        await setDoc(doc(db, 'items', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    for (const clm of seedClaims) {
      const path = `claims/${clm.id}`;
      try {
        await setDoc(doc(db, 'claims', clm.id), {
          ...clm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore signout error if local session
    }
    setUserProfile(null);
    setMobileMenuOpen(false);
    setBreadcrumbDropdownOpen(false);
  };

  if (!userProfile) {
    return (
      <>
        <LandingPage onOpenAuth={(mode) => setAuthModalMode(mode)} />
        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onAuthenticated={(profile) => {
              setUserProfile(profile);
              setAuthModalMode(null);
              handleNotify(
                `Welcome, ${profile.displayName}`,
                profile.role === 'admin'
                  ? 'Signed into Highest Privilege Campus Admin Console.'
                  : 'Signed into University Student Portal.',
                'success'
              );
            }}
          />
        )}
      </>
    );
  }

  const isStudent = userProfile.role === 'student';

  const studentNavOptions: Array<{
    id: StudentTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'directory',
      label: 'Found Directory',
      icon: LayoutGrid,
      badge: items.filter((i) => i.type === 'found' && i.status !== 'resolved').length,
    },
    { id: 'image_search', label: 'Perceptual Image Hash Search', icon: Fingerprint },
    { id: 'report_item', label: 'Report Lost Item', icon: FilePlus2 },
    {
      id: 'my_claims',
      label: 'My Claims & Status',
      icon: FolderCheck,
      badge: claims.filter((c) => c.claimantId === userProfile.uid).length,
    },
  ];

  const adminNavOptions: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'log_found', label: 'Log Found Item', icon: PlusCircle },
    {
      id: 'claims',
      label: 'Claim Verification',
      icon: ShieldCheck,
      badge: claims.filter((c) => c.status === 'pending').length,
    },
    {
      id: 'resolved_history',
      label: 'Resolved History',
      icon: Archive,
      badge: items.filter((i) => i.status === 'resolved').length,
    },
    { id: 'database', label: 'Database Maintenance', icon: Database },
  ];

  const currentBreadcrumbThreeLabel = isStudent
    ? studentNavOptions.find((o) => o.id === studentTab)?.label || 'Found Directory'
    : adminNavOptions.find((o) => o.id === adminTab)?.label || 'Log Found Item';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Desktop Left Sidebar Navigation (Fixed on md and larger screens) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-white border-r border-slate-200/90 justify-between p-5">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                FI
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                FoundIt
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold ${
                isStudent
                  ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200/60'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
              }`}
            >
              {isStudent ? 'Student' : 'Admin'}
            </span>
          </div>

          <nav className="space-y-1">
            {(isStudent ? studentNavOptions : adminNavOptions).map((opt) => {
              const Icon = opt.icon;
              const isActive = isStudent
                ? studentTab === opt.id
                : adminTab === opt.id;
              return (
                <motion.button
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    isStudent
                      ? setStudentTab(opt.id as StudentTab)
                      : setAdminTab(opt.id as AdminTab)
                  }
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {typeof opt.badge === 'number' && opt.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-3">
          <div className="px-2 space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
              <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
              <span className="truncate">{userProfile.displayName}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{userProfile.email}</p>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              ID: {userProfile.studentId}
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Fixed Top Workspace Header — remains sticky, visible, and accessible on scroll */}
        <header className="fixed top-0 left-0 right-0 md:left-64 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button (only on < md screens) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb Trail: [1: FoundIt] / [2: Portal] / [3: Interactive Desktop Dropdown] */}
            <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <span className="font-bold text-slate-900 font-display whitespace-nowrap">
                FoundIt
              </span>
              <span className="text-slate-400">/</span>
              <span className="whitespace-nowrap">
                {isStudent ? 'Student Portal' : 'Admin Console'}
              </span>
              <span className="text-slate-400">/</span>

              {/* Breadcrumb #3: Interactive Custom Dropdown on Desktop (md and up) */}
              <div ref={breadcrumbDropdownRef} className="hidden md:block relative">
                <button
                  type="button"
                  onClick={() => setBreadcrumbDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{currentBreadcrumbThreeLabel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-150 ${
                      breadcrumbDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {breadcrumbDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50"
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-mono uppercase text-slate-400">
                        Navigate {isStudent ? 'Student' : 'Admin'} Section
                      </div>
                      {(isStudent ? studentNavOptions : adminNavOptions).map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = isStudent
                          ? studentTab === opt.id
                          : adminTab === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              if (isStudent) {
                                setStudentTab(opt.id as StudentTab);
                              } else {
                                setAdminTab(opt.id as AdminTab);
                              }
                              setBreadcrumbDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-xs font-semibold flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-[#1D4ED8]'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 truncate">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{opt.label}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Breadcrumb #3 on Mobile (< md): Plain static label */}
              <span className="md:hidden text-slate-900 font-semibold truncate max-w-[140px]">
                {currentBreadcrumbThreeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isStudent ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setStudentTab('image_search')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Image Hash Search</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setAdminTab('log_found')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Found Drop-Off</span>
              </motion.button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="md:hidden px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Drawer Navigation (fixed below top header when open on mobile) */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-slate-200 shadow-lg px-6 py-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {(isStudent ? studentNavOptions : adminNavOptions).map((opt) => {
                const isSelected = isStudent
                  ? studentTab === opt.id
                  : adminTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      if (isStudent) {
                        setStudentTab(opt.id as StudentTab);
                      } else {
                        setAdminTab(opt.id as AdminTab);
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 text-xs font-semibold rounded-lg text-left ${
                      isSelected
                        ? 'bg-[#1D4ED8] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspace Viewport (offset by pt-20 for the fixed 56px top header) */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {isStudent ? (
            <StudentDashboard
              user={userProfile}
              activeTab={studentTab}
              setActiveTab={setStudentTab}
              items={items}
              claims={claims}
              onCreateItem={handleCreateItem}
              onCreateClaim={handleCreateClaim}
              onDeleteItem={handleDeleteItem}
              onNotify={handleNotify}
            />
          ) : (
            <AdminDashboard
              user={userProfile}
              activeTab={adminTab}
              setActiveTab={setAdminTab}
              items={items}
              claims={claims}
              onCreateItem={handleCreateItem}
              onUpdateItemStatus={handleUpdateItemStatus}
              onUnresolveItem={handleUnresolveItem}
              onDeleteItem={handleDeleteItem}
              onModerateClaim={handleModerateClaim}
              onDeleteClaim={handleDeleteClaim}
              onSeedDatabase={handleSeedDatabase}
              onNotify={handleNotify}
            />
          )}
        </main>

        {/* Common Authenticated Workspace Credits Footer */}
        <footer className="border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8 py-5 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-slate-900 font-display">FoundIt Campus Directory</span>
              <span className="text-slate-300">•</span>
              <span>
                Designed &amp; Developed by <strong className="text-slate-900">Soukaryo Chandra</strong> (Reg. No:{' '}
                <span className="font-mono font-semibold text-slate-900">240953644</span>)
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[11px] text-slate-400">
                School of Computer Engineering, M.I.T., Manipal (FLEXICORE-3131)
              </span>
              <a
                href="/FoundIt_Web_Technology_Project_Report.doc"
                download="FoundIt_Web_Technology_Project_Report.doc"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
              >
                Download Project Report (.doc)
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Feedback Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-xl p-3.5 shadow-xl flex items-start gap-3"
            >
              {toast.variant === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {toast.variant === 'info' && (
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              )}
              {toast.variant === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">{toast.title}</div>
                <div className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                  {toast.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
