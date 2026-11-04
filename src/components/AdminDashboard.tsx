import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  Search,
  MapPin,
  Fingerprint,
  RefreshCw,
  Archive,
  PlusCircle,
  RotateCcw,
  Upload,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Building2,
  Download,
} from 'lucide-react';
import {
  CampusItem,
  ItemClaim,
  UserProfile,
  CAMPUS_CATEGORIES,
  CAMPUS_DROP_LOCATIONS,
  ItemCategory,
  ItemStatus,
  ClaimStatus,
} from '../types';
import {
  computePerceptualHash,
  comparePerceptualHashes,
  getItemDisplayImage,
  PRESET_CAMPUS_VISUALS,
  renderCampusItemCanvas,
} from '../utils/imageHash';

export type AdminTab = 'log_found' | 'claims' | 'resolved_history' | 'database';

export interface ResolvedMatchedFoundDetails {
  title: string;
  category: ItemCategory;
  dropLocation: string;
  dateOccurred: string;
  description: string;
  imageDataUrl: string;
  imageHash: string;
  similarity: number;
  adminNotes: string;
  existingFoundItemId?: string;
}

interface AdminDashboardProps {
  user: UserProfile;
  items: CampusItem[];
  claims: ItemClaim[];
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onCreateItem: (item: Omit<CampusItem, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onResolveMatchedLostReport: (
    lostItem: CampusItem,
    foundDetails: ResolvedMatchedFoundDetails
  ) => Promise<void>;
  onUpdateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>;
  onUnresolveItem: (itemId: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onModerateClaim: (
    claimId: string,
    itemId: string,
    status: ClaimStatus,
    adminNotes: string,
    linkedLostItemId?: string
  ) => Promise<void>;
  onDeleteClaim: (claimId: string) => Promise<void>;
  onSeedDatabase: () => Promise<void>;
  onNotify: (title: string, message: string, variant?: 'success' | 'info' | 'warning') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  items,
  claims,
  activeTab,
  setActiveTab,
  onCreateItem,
  onResolveMatchedLostReport,
  onUpdateItemStatus,
  onUnresolveItem,
  onDeleteItem,
  onModerateClaim,
  onDeleteClaim,
  onSeedDatabase,
  onNotify,
}) => {
  const [dbFilter, setDbFilter] = useState<'all' | 'found' | 'lost'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [claimLinkedLostIdMap, setClaimLinkedLostIdMap] = useState<Record<string, string>>({});
  const [claimShowAllLostMap, setClaimShowAllLostMap] = useState<Record<string, boolean>>({});
  const [claimHashScannedMap, setClaimHashScannedMap] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<{
    message: string;
    type: 'success' | 'info';
    targetTab?: AdminTab;
  } | null>(null);

  // Anonymous Found Item Intake Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [dropLocation, setDropLocation] = useState<string>(CAMPUS_DROP_LOCATIONS[0]);
  const [customLocationNote, setCustomLocationNote] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageHash, setImageHash] = useState('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(PRESET_CAMPUS_VISUALS[0].key);
  const [selectedExistingFoundId, setSelectedExistingFoundId] = useState<string>('');
  const [submittingFound, setSubmittingFound] = useState(false);
  const [selectedMatchedLostId, setSelectedMatchedLostId] = useState<string | null>(null);
  const [directMatchNotesMap, setDirectMatchNotesMap] = useState<Record<string, string>>({});
  const [approvingMatchedLostId, setApprovingMatchedLostId] = useState<string | null>(null);

  // Partition items and claims cleanly
  const activeFoundItems = useMemo(
    () => items.filter((i) => i.type === 'found' && i.status !== 'resolved'),
    [items]
  );
  const lostReports = useMemo(
    () => items.filter((i) => i.type === 'lost' && i.status !== 'resolved'),
    [items]
  );
  const pendingClaims = useMemo(
    () => claims.filter((c) => c.status === 'pending'),
    [claims]
  );
  const resolvedItems = useMemo(
    () => items.filter((i) => i.status === 'resolved'),
    [items]
  );
  const resolvedClaims = useMemo(
    () => claims.filter((c) => c.status === 'approved' || c.status === 'rejected'),
    [claims]
  );

  // Filtered database items (excludes resolved items since resolved items reside exclusively in Resolved History)
  const filteredDbItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status === 'resolved') return false;
      if (dbFilter === 'found' && item.type !== 'found') return false;
      if (dbFilter === 'lost' && item.type !== 'lost') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.reporterName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [items, dbFilter, searchQuery]);

  // Live perceptual hash correlation (> 70% similarity) against existing student Lost Reports when logging a Found item
  const potentialLostMatches = useMemo(() => {
    if (!imageHash) return [];
    return lostReports
      .map((lostItem) => ({
        item: lostItem,
        similarity: comparePerceptualHashes(imageHash, lostItem.imageHash).matchPercentage,
      }))
      .filter((m) => m.similarity > 70)
      .sort((a, b) => b.similarity - a.similarity);
  }, [imageHash, lostReports]);

  const triggerBanner = (
    message: string,
    type: 'success' | 'info' = 'success',
    targetTab?: AdminTab
  ) => {
    setBannerFeedback({ message, type, targetTab });
    setTimeout(() => {
      setBannerFeedback((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHashId(id);
    onNotify('Hash Copied', `64-bit dHash (${hash}) copied to clipboard.`, 'info');
    setTimeout(() => setCopiedHashId(null), 1800);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const computed = await computePerceptualHash(reader.result);
          setImageDataUrl(computed.previewDataUrl);
          setImageHash(computed.hashHex);
          const matches = lostReports
            .map((l) => ({
              item: l,
              similarity: comparePerceptualHashes(computed.hashHex, l.imageHash).matchPercentage,
            }))
            .filter((m) => m.similarity > 70)
            .sort((a, b) => b.similarity - a.similarity);
          setSelectedMatchedLostId(matches[0]?.item.id ?? null);
          onNotify(
            'Perceptual Hash Computed',
            matches.length > 0
              ? `dHash ${computed.hashHex} matched ${matches.length} student lost report(s) with > 70% similarity!`
              : `Generated 64-bit dHash: ${computed.hashHex}`,
            matches.length > 0 ? 'success' : 'info'
          );
        } catch (err) {
          console.error('Failed to process photo:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = async (presetKey: string) => {
    setSelectedPresetKey(presetKey);
    const preset = PRESET_CAMPUS_VISUALS.find((p) => p.key === presetKey);
    const canvasDataUrl = renderCampusItemCanvas(presetKey, 'catalog');
    const computed = await computePerceptualHash(canvasDataUrl);
    setImageDataUrl(computed.previewDataUrl);
    setImageHash(computed.hashHex);
    if (preset) {
      setTitle(preset.defaultTitle);
      setCategory(preset.category);
      setDescription(preset.defaultDescription);
    }
    const matches = lostReports
      .map((l) => ({
        item: l,
        similarity: comparePerceptualHashes(computed.hashHex, l.imageHash).matchPercentage,
      }))
      .filter((m) => m.similarity > 70)
      .sort((a, b) => b.similarity - a.similarity);
    setSelectedMatchedLostId(matches[0]?.item.id ?? null);
    onNotify(
      matches.length > 0
        ? `Matched Student Lost Report (${matches[0].similarity}%)`
        : 'Studio Visual & Hash Ready',
      matches.length > 0
        ? `Tap ${matches[0].item.reporterName}'s report (> 70% match) to approve their claim & move directly to Resolved History.`
        : `Applied ${preset?.label || presetKey} profile (dHash: ${computed.hashHex}).`,
      matches.length > 0 ? 'success' : 'info'
    );
  };

  const handleSearchLostHashMatches = async () => {
    let targetHash = imageHash;
    if (!targetHash) {
      const preset = PRESET_CAMPUS_VISUALS.find((p) => p.key === selectedPresetKey);
      const canvasDataUrl = renderCampusItemCanvas(selectedPresetKey, 'catalog');
      const computed = await computePerceptualHash(canvasDataUrl);
      setImageDataUrl(computed.previewDataUrl);
      setImageHash(computed.hashHex);
      targetHash = computed.hashHex;
      if (preset && !title.trim()) {
        setTitle(preset.defaultTitle);
        setCategory(preset.category);
        setDescription(preset.defaultDescription);
      }
    }

    const matches = lostReports
      .map((l) => ({
        item: l,
        similarity: comparePerceptualHashes(targetHash, l.imageHash).matchPercentage,
      }))
      .filter((m) => m.similarity > 70)
      .sort((a, b) => b.similarity - a.similarity);

    if (matches.length > 0) {
      setSelectedMatchedLostId(matches[0].item.id);
      onNotify(
        `Found ${matches.length} Student Match(es) > 70%`,
        `Top match: "${matches[0].item.title}" reported by ${matches[0].item.reporterName} (${matches[0].similarity}% similarity). Tap to approve claim!`,
        'success'
      );
    } else {
      setSelectedMatchedLostId(null);
      onNotify(
        'No Lost Reports > 70% Similarity',
        `Evaluated ${lostReports.length} active student lost reports against dHash 0x${targetHash}.`,
        'info'
      );
    }
  };

  const handleDirectApproveMatchedLost = async (
    matchedLostItem: CampusItem,
    similarity: number
  ) => {
    setApprovingMatchedLostId(matchedLostItem.id);
    try {
      let finalDataUrl = imageDataUrl;
      let finalHash = imageHash;

      if (!finalDataUrl || !finalHash) {
        const canvasDataUrl = renderCampusItemCanvas(selectedPresetKey, 'catalog');
        const computed = await computePerceptualHash(canvasDataUrl);
        finalDataUrl = computed.previewDataUrl;
        finalHash = computed.hashHex;
      }

      const combinedLocation = customLocationNote.trim()
        ? `${dropLocation} — ${customLocationNote.trim()}`
        : dropLocation;

      const defaultNote = `Matched via 64-bit perceptual hash (${similarity}% similarity) at ${dropLocation}. Ownership claim approved — unified item ID ${matchedLostItem.id} archived in Resolved History.`;
      const adminNotes =
        directMatchNotesMap[matchedLostItem.id]?.trim() || defaultNote;

      await onResolveMatchedLostReport(matchedLostItem, {
        title: title.trim() || matchedLostItem.title,
        category: category || matchedLostItem.category,
        dropLocation: combinedLocation.slice(0, 120),
        dateOccurred,
        description: description.trim() || matchedLostItem.description,
        imageDataUrl: finalDataUrl,
        imageHash: finalHash,
        similarity,
        adminNotes,
        ...(selectedExistingFoundId
          ? { existingFoundItemId: selectedExistingFoundId }
          : {}),
      });

      setTitle('');
      setCustomLocationNote('');
      setDescription('');
      setImageDataUrl('');
      setImageHash('');
      setSelectedExistingFoundId('');
      setSelectedMatchedLostId(null);

      triggerBanner(
        `Approved ${matchedLostItem.reporterName}'s claim (${similarity}% hash match)! Both the Found item and Student Lost Report ("${matchedLostItem.id}") are now resolved and moved to Resolved History with zero duplicates.`,
        'success',
        'resolved_history'
      );
      onNotify(
        'Both Found & Student Lost Item Resolved',
        `Matched item (${matchedLostItem.id}) for ${matchedLostItem.reporterName} moved directly to Resolved History.`,
        'success'
      );
    } finally {
      setApprovingMatchedLostId(null);
    }
  };

  const handleLogFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmittingFound(true);
    try {
      let finalDataUrl = imageDataUrl;
      let finalHash = imageHash;

      if (!finalDataUrl || !finalHash) {
        const canvasDataUrl = renderCampusItemCanvas(selectedPresetKey, 'catalog');
        const computed = await computePerceptualHash(canvasDataUrl);
        finalDataUrl = computed.previewDataUrl;
        finalHash = computed.hashHex;
      }

      const combinedLocation = customLocationNote.trim()
        ? `${dropLocation} — ${customLocationNote.trim()}`
        : dropLocation;

      const newItemId = `item_found_${Date.now()}`;
      await onCreateItem({
        id: newItemId,
        title: title.trim(),
        description: description.trim(),
        category,
        type: 'found',
        location: combinedLocation.slice(0, 120),
        dateOccurred,
        imageDataUrl: finalDataUrl,
        imageHash: finalHash,
        status: 'approved', // Directly live in Found Directory
        reporterId: user.uid,
        reporterName: 'Anonymous Drop-off',
        visibility: 'campus',
      });

      const loggedTitle = title.trim();
      setTitle('');
      setCustomLocationNote('');
      setDescription('');
      setImageDataUrl('');
      setImageHash('');
      setSelectedMatchedLostId(null);
      triggerBanner(
        `"${loggedTitle}" logged from ${dropLocation} and published to the active Found Directory.`,
        'success'
      );
      onNotify(
        'Found Item Published',
        `"${loggedTitle}" is now live in the student Found Directory (Anonymous Drop-off).`,
        'success'
      );
    } finally {
      setSubmittingFound(false);
    }
  };

  const handleClaimDecision = async (
    claim: ItemClaim,
    status: 'approved' | 'rejected',
    coResolveLostItemId?: string
  ) => {
    setProcessingId(claim.id);
    try {
      const coResolvedLostItem = coResolveLostItemId
        ? lostReports.find((l) => l.id === coResolveLostItemId)
        : undefined;

      const notes =
        adminNotesMap[claim.id]?.trim() ||
        (status === 'approved'
          ? coResolvedLostItem
            ? `Ownership verified by Campus Security. Co-resolved Found Item (${claim.itemId}) and Student Lost Report (${coResolvedLostItem.id}). Ready for pickup with university ID.`
            : 'Ownership verified by Campus Security. Item ready for pickup with university ID.'
          : 'Insufficient ownership verification details provided.');

      await onModerateClaim(
        claim.id,
        claim.itemId,
        status,
        notes,
        status === 'approved' ? coResolveLostItemId : undefined
      );

      if (status === 'approved') {
        triggerBanner(
          coResolvedLostItem
            ? `Claim for "${claim.itemTitle}" approved! Both the Found Item (${claim.itemId}) and ${claim.claimantName}'s Lost Report ("${coResolvedLostItem.title}") were resolved and archived in Resolved History.`
            : `Claim for "${claim.itemTitle}" approved! Item removed from active Found Directory and archived in Resolved History.`,
          'success',
          'resolved_history'
        );
        onNotify(
          coResolvedLostItem
            ? 'Found Item & Student Lost Report Resolved'
            : 'Claim Approved & Item Resolved',
          coResolvedLostItem
            ? `Resolved both "${claim.itemTitle}" and ${claim.claimantName}'s lost report "${coResolvedLostItem.title}".`
            : `"${claim.itemTitle}" has been moved out of the Found Directory into Resolved History.`,
          'success'
        );
      } else {
        triggerBanner(
          `Claim for "${claim.itemTitle}" marked as rejected and moved to Resolved History.`,
          'info',
          'resolved_history'
        );
        onNotify('Claim Rejected', `Claim by ${claim.claimantName} was declined.`, 'warning');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnresolve = async (item: CampusItem) => {
    setProcessingId(item.id);
    try {
      await onUnresolveItem(item.id);
      triggerBanner(
        `"${item.title}" unresolved and restored to the active Found Directory!`,
        'success'
      );
      onNotify(
        'Restored to Found Directory',
        `"${item.title}" is now back in the active Found Directory for students to view and claim.`,
        'success'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleSeedClick = async () => {
    setSeeding(true);
    try {
      await onSeedDatabase();
      triggerBanner('Campus sample records and perceptual hashes synchronized.', 'success');
      onNotify(
        'Database Seeded',
        'Sample found drop-offs, lost reports, and resolved items loaded.',
        'success'
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleExportToCSV = () => {
    setExportingCsv(true);
    try {
      const escapeCsvCell = (value: unknown): string => {
        if (value === null || value === undefined) return '""';
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows: string[] = [];

      // Section 1: Campus Items (Found Drop-Offs, Student Lost Reports, and Resolved Archive)
      rows.push(
        [
          'Record Type',
          'ID',
          'Directory Type',
          'Title',
          'Category',
          'Status',
          'Location / Drop-Off Desk',
          'Date Occurred',
          '64-Bit Perceptual dHash',
          'Reporter / Source',
          'Description / Proof',
          'Linked Item ID',
          'Match Score (%)',
          'Admin Notes',
        ]
          .map(escapeCsvCell)
          .join(',')
      );

      for (const item of items) {
        rows.push(
          [
            'ITEM',
            item.id,
            item.type.toUpperCase(),
            item.title,
            item.category,
            item.status,
            item.location,
            item.dateOccurred,
            item.imageHash,
            item.type === 'found' ? 'Anonymous Drop-off' : item.reporterName,
            item.description,
            '',
            '',
            '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      }

      // Section 2: Student Ownership Claims
      for (const claim of claims) {
        const linkedItem = items.find((i) => i.id === claim.itemId);
        rows.push(
          [
            'CLAIM',
            claim.id,
            'OWNERSHIP_CLAIM',
            claim.itemTitle,
            linkedItem?.category || '',
            claim.status,
            linkedItem?.location || '',
            linkedItem?.dateOccurred || '',
            linkedItem?.imageHash || '',
            claim.claimantName,
            claim.proofDescription,
            claim.itemId,
            claim.matchScore,
            claim.adminNotes || '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      }

      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const dateStamp = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `foundit-campus-records-${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerBanner(
        `Exported ${items.length} items and ${claims.length} claims to foundit-campus-records-${dateStamp}.csv.`,
        'success'
      );
      onNotify(
        'CSV Export Downloaded',
        `Saved ${items.length} campus items and ${claims.length} claims for record keeping.`,
        'success'
      );
    } finally {
      setTimeout(() => setExportingCsv(false), 600);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Telemetry & Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Highest Privilege Admin Mode
            </span>
            <span className="text-xs text-slate-400 font-mono">{user.email}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Campus Lost & Found Administration
          </h1>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('log_found')}
            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
              activeTab === 'log_found'
                ? 'bg-teal-50/90 border-teal-300 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-medium text-teal-700">Active Found Dir</div>
            <div className="text-lg font-bold text-teal-900 font-mono tabular-nums">
              {activeFoundItems.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
              activeTab === 'claims'
                ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-medium text-amber-800">Pending Claims</div>
            <div className="text-lg font-bold text-amber-900 font-mono tabular-nums">
              {pendingClaims.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resolved_history')}
            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
              activeTab === 'resolved_history'
                ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-medium text-emerald-800">Resolved Archive</div>
            <div className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
              {resolvedItems.length}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
              activeTab === 'database'
                ? 'bg-indigo-50/90 border-indigo-300 shadow-xs'
                : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-medium text-indigo-800">Lost Reports</div>
            <div className="text-lg font-bold text-indigo-900 font-mono tabular-nums">
              {lostReports.length}
            </div>
          </button>
        </div>
      </div>

      {/* Persistent Action Feedback Banner */}
      <AnimatePresence>
        {bannerFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-xl px-4 py-3 border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
              bannerFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  bannerFeedback.type === 'success' ? 'text-emerald-600' : 'text-teal-400'
                }`}
              />
              <span>{bannerFeedback.message}</span>
            </div>
            <div className="flex items-center gap-2">
              {bannerFeedback.targetTab && activeTab !== bannerFeedback.targetTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab(bannerFeedback.targetTab!)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  View in Resolved History
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setBannerFeedback(null)}
                className="text-xs opacity-70 hover:opacity-100 px-1.5 py-0.5 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: LOG FOUND ITEM (ANONYMOUS DROP-OFF INTAKE) */}
      {activeTab === 'log_found' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60 mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Anonymous Campus Drop-Off Intake
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Log New Found Item into Directory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Students drop found items anonymously at campus lost & found desks. Record the item and the collection desk where it was submitted below.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogFoundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item Name & Distinguishing Model *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g., 14" MacBook Pro in Felt Sleeve, 32oz Navy HydroFlask...'
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:ring-3 focus:ring-teal-500/15 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-none"
                  >
                    {CAMPUS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date Submitted at Desk *
                  </label>
                  <input
                    type="date"
                    required
                    value={dateOccurred}
                    onChange={(e) => setDateOccurred(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Campus Drop-Off Submission Location */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    Submitted Campus Lost & Found Location *
                  </label>
                  <select
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-teal-200 rounded-xl focus:border-teal-600 focus:outline-none font-medium text-slate-800"
                  >
                    {CAMPUS_DROP_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Original Find Area / Storage Bin Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLocationNote}
                    onChange={(e) => setCustomLocationNote(e.target.value)}
                    placeholder="e.g., Turned in from 3rd Floor Study Carrels, Bin #B-14"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Physical Condition & Verification Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe visible wear, case color, stickers, or distinguishing markings..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Image Upload or Studio Sample Generator */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item Photograph & 64-Bit Perceptual Hash
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-teal-500 hover:bg-teal-50/20 transition-all cursor-pointer text-center">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Upload Item Photo</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Computes 64-bit dHash</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Or Quick-Load Hardware Preset:
                    </div>
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {PRESET_CAMPUS_VISUALS.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => handleApplyPreset(preset.key)}
                          className={`px-2 py-1 text-[11px] rounded-md font-medium transition-all cursor-pointer active:scale-95 ${
                            selectedPresetKey === preset.key && imageDataUrl
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {preset.label.split(' ')[0]} {preset.label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <motion.button
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={handleSearchLostHashMatches}
                    className="sm:w-auto py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Fingerprint className="w-4 h-4 text-indigo-700" />
                    <span>Search Hash Match with Lost Reports (&gt; 70%)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={submittingFound}
                    className="flex-1 py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {submittingFound
                      ? 'Computing Hash & Publishing...'
                      : 'Publish Unclaimed to Found Directory'}
                  </motion.button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Live Perceptual Hash Preview & Interactive >70% Lost Report Claim Approval */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-teal-600" />
                  Admin Image Hash Matcher
                </h3>
                <button
                  type="button"
                  onClick={handleSearchLostHashMatches}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer"
                >
                  Scan Lost Reports
                </button>
              </div>

              {/* Allow Admin to also select an ALREADY-LOGGED Found Item from the directory to hash-match & resolve with a Student Lost Report */}
              {activeFoundItems.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Match Source (New Intake or Existing Found Directory Item):
                  </label>
                  <select
                    value={selectedExistingFoundId}
                    onChange={(e) => {
                      const foundId = e.target.value;
                      setSelectedExistingFoundId(foundId);
                      if (!foundId) return;
                      const existingFound = activeFoundItems.find((f) => f.id === foundId);
                      if (existingFound) {
                        setTitle(existingFound.title);
                        setCategory(existingFound.category);
                        setDescription(existingFound.description);
                        setImageDataUrl(existingFound.imageDataUrl);
                        setImageHash(existingFound.imageHash);
                        const matches = lostReports
                          .map((l) => ({
                            item: l,
                            similarity: comparePerceptualHashes(
                              existingFound.imageHash,
                              l.imageHash
                            ).matchPercentage,
                          }))
                          .filter((m) => m.similarity > 70)
                          .sort((a, b) => b.similarity - a.similarity);
                        setSelectedMatchedLostId(matches[0]?.item.id ?? null);
                        onNotify(
                          'Loaded Existing Found Item for Hash Search',
                          `Comparing "${existingFound.title}" (${existingFound.id}) against ${lostReports.length} student lost reports. Approving will resolve BOTH items!`,
                          'info'
                        );
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="">
                      New Intake Drop-Off (Current Form / Uploaded Photo)
                    </option>
                    {activeFoundItems.map((f) => (
                      <option key={f.id} value={f.id}>
                        Existing Found Item: {f.title} (ID: {f.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {imageDataUrl ? (
                <div className="space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                    <img
                      src={imageDataUrl}
                      alt="Found Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                      {selectedExistingFoundId
                        ? `Existing Found ID: ${selectedExistingFoundId}`
                        : 'Anonymous Drop-Off'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <span className="text-xs text-slate-400">Computed 64-Bit dHash:</span>
                    <span className="text-xs font-mono font-semibold text-teal-400 tracking-wider">
                      0x{imageHash}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <Fingerprint className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-xs font-medium text-slate-600">
                    Upload a photo, select a hardware preset (e.g., <strong>14&quot; MacBook</strong> or <strong>Cognac Leather</strong>), or pick an existing Found item above to match against student Lost Reports.
                  </p>
                </div>
              )}

              {/* Live Correlation with Student Lost Reports (> 70% Similarity) */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Student Lost Reports (&gt; 70% Hash Match)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {potentialLostMatches.length} of {lostReports.length} matched
                  </span>
                </div>

                {potentialLostMatches.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-teal-800 bg-teal-50/80 border border-teal-200/80 rounded-lg px-2.5 py-1.5 font-medium">
                      Tap a matched student below (&gt; 70% similarity) to directly approve their claim. The reported and found Item ID will unify and move straight to <strong>Resolved History</strong> with zero duplicates.
                    </p>

                    {potentialLostMatches.map(({ item, similarity }) => {
                      const isSelected = selectedMatchedLostId === item.id;
                      const isApproving = approvingMatchedLostId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-400 shadow-xs'
                              : 'bg-white border-teal-200 hover:border-teal-400'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedMatchedLostId((prev) =>
                                prev === item.id ? null : item.id
                              )
                            }
                            className="w-full p-3 text-left flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={getItemDisplayImage(item)}
                                alt={item.title}
                                className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {item.reporterName}
                                </div>
                                <div className="text-[11px] font-medium text-slate-700 truncate">
                                  Lost: {item.title}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 truncate">
                                  ID: {item.id} • 0x{item.imageHash}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-600 text-white tabular-nums">
                                {similarity}% Match
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-800">
                                {isSelected ? 'Selected ▲' : 'Tap to Approve ▼'}
                              </span>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.16 }}
                                className="px-3 pb-3 pt-2 border-t border-emerald-200/80 space-y-2.5 bg-white/90"
                              >
                                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-700">
                                      Unified Item ID (Lost = Found):
                                    </span>
                                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                      {item.id}
                                    </span>
                                  </div>
                                  <div className="text-slate-600">
                                    <strong>Reported Location:</strong> {item.location}
                                  </div>
                                  <div className="text-slate-600">
                                    <strong>Student Proof:</strong> &ldquo;{item.description}&rdquo;
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Admin Pickup &amp; Resolution Note
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      directMatchNotesMap[item.id] ??
                                      `Matched via 64-bit perceptual hash (${similarity}%) at ${dropLocation}. Approved for pickup with Student ID.`
                                    }
                                    onChange={(e) =>
                                      setDirectMatchNotesMap((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
                                  />
                                </div>

                                <motion.button
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.98 }}
                                  type="button"
                                  disabled={isApproving}
                                  onClick={() =>
                                    handleDirectApproveMatchedLost(item, similarity)
                                  }
                                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>
                                    {isApproving
                                      ? 'Unifying Item ID & Moving to Resolved...'
                                      : `Approve ${item.reporterName}'s Claim & Move to Resolved`}
                                  </span>
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {imageHash
                      ? 'No active student lost reports exceed the 70% perceptual hash similarity threshold for this image. Publishing will list this item in the Found Directory.'
                      : 'Click "Search Hash Match with Lost Reports (> 70%)" or select a hardware preset above to scan student lost reports.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: CLAIM VERIFICATION */}
      {activeTab === 'claims' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pending Student Ownership Claims</h2>
              <p className="text-xs text-slate-500">
                Approving a claim marks the item as <strong>Resolved</strong>, removes it from the active Found Directory, and archives it in <strong>Resolved History</strong>.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              {pendingClaims.length} Awaiting Review
            </span>
          </div>

          {pendingClaims.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">All Pending Claims Reviewed</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                There are no pending ownership claims in the queue. Approved items are archived in the Resolved History tab.
              </p>
              {resolvedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('resolved_history')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Inspect Resolved History ({resolvedItems.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => {
                const isProcessing = processingId === claim.id;
                const linkedItem = items.find((i) => i.id === claim.itemId);

                // Find all active Lost Items posted by this student claimant
                const studentLostItems = lostReports.filter(
                  (l) =>
                    l.reporterId === claim.claimantId ||
                    l.reporterName.toLowerCase() === claim.claimantName.toLowerCase()
                );

                const showAllCampusLost = Boolean(claimShowAllLostMap[claim.id]);
                const candidatePool =
                  showAllCampusLost || studentLostItems.length === 0
                    ? lostReports
                    : studentLostItems;

                // Rank the student's lost items by 64-bit perceptual hash similarity against the claimed Found item
                const rankedStudentLost = candidatePool
                  .map((lostItem) => {
                    const comp = linkedItem
                      ? comparePerceptualHashes(linkedItem.imageHash, lostItem.imageHash)
                      : { matchPercentage: 0, hammingDistance: 64 };
                    return {
                      lostItem,
                      similarity: comp.matchPercentage,
                      hammingDistance: comp.hammingDistance,
                    };
                  })
                  .sort((a, b) => b.similarity - a.similarity);

                // Determine which Student Lost Item is currently selected to co-resolve with this Found Item
                const explicitSelection = claimLinkedLostIdMap[claim.id];
                const defaultAutoLostId =
                  claim.linkedLostItemId &&
                  lostReports.some((l) => l.id === claim.linkedLostItemId)
                    ? claim.linkedLostItemId
                    : rankedStudentLost[0] && rankedStudentLost[0].similarity > 70
                    ? rankedStudentLost[0].lostItem.id
                    : '';

                const effectiveLostItemId =
                  explicitSelection === 'NONE'
                    ? ''
                    : explicitSelection || defaultAutoLostId;

                const selectedLostReport = lostReports.find(
                  (l) => l.id === effectiveLostItemId
                );

                return (
                  <motion.div
                    layout
                    key={claim.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        {linkedItem && (
                          <img
                            src={getItemDisplayImage(linkedItem)}
                            alt={claim.itemTitle}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                              Pending Verification
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-teal-50 text-teal-800">
                              {claim.matchScore}% Hash Correlation
                            </span>
                            {selectedLostReport && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                Co-Resolving Lost Report: {selectedLostReport.id}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            Claim for: {claim.itemTitle}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Student Claimant:{' '}
                            <span className="font-semibold text-slate-900">
                              {claim.claimantName}
                            </span>{' '}
                            <span className="text-slate-400 font-mono">
                              (Found Item ID: {claim.itemId})
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          disabled={isProcessing}
                          onClick={() =>
                            handleClaimDecision(
                              claim,
                              'approved',
                              effectiveLostItemId || undefined
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isProcessing
                            ? 'Approving...'
                            : selectedLostReport
                            ? 'Approve & Resolve Found + Lost Item'
                            : 'Approve & Mark Resolved'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleClaimDecision(claim, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Claim
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Student Proof of Ownership
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {claim.proofDescription}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Admin Pickup Instructions / Verification Note
                        </label>
                        <input
                          type="text"
                          value={adminNotesMap[claim.id] ?? claim.adminNotes ?? ''}
                          onChange={(e) =>
                            setAdminNotesMap((prev) => ({ ...prev, [claim.id]: e.target.value }))
                          }
                          placeholder="e.g., Serial verified. Ready for pickup at Student Union Room 104 with ID."
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Co-Resolve Student's Logged Lost Item Report Panel (Choose from Student's Lost Items OR Image Hash Search on Student's Lost Items) */}
                    <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/80 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Fingerprint className="w-4 h-4 text-indigo-600" />
                            <span>
                              Co-Resolve {claim.claimantName}&apos;s Logged Lost Item Report (
                              {studentLostItems.length} posted by student)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Select or run Image Hash Search on {claim.claimantName}&apos;s lost reports so approving this claim resolves <strong>both</strong> the Found item and the Student&apos;s Lost item simultaneously.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setClaimHashScannedMap((prev) => ({
                                ...prev,
                                [claim.id]: true,
                              }));
                              if (rankedStudentLost.length > 0) {
                                const best = rankedStudentLost[0];
                                setClaimLinkedLostIdMap((prev) => ({
                                  ...prev,
                                  [claim.id]: best.lostItem.id,
                                }));
                                onNotify(
                                  `Hash Search on ${claim.claimantName}'s Lost Items`,
                                  `Top match: "${best.lostItem.title}" (${best.similarity}% similarity, d=${best.hammingDistance}). Attached for co-resolution!`,
                                  'success'
                                );
                              } else {
                                onNotify(
                                  'No Active Lost Reports Found',
                                  `${claim.claimantName} has no open lost item reports to match.`,
                                  'info'
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
                          >
                            <Fingerprint className="w-3.5 h-3.5" />
                            <span>
                              Image Hash Search {claim.claimantName}&apos;s Lost Items
                            </span>
                          </button>

                          {lostReports.length > studentLostItems.length && (
                            <button
                              type="button"
                              onClick={() =>
                                setClaimShowAllLostMap((prev) => ({
                                  ...prev,
                                  [claim.id]: !prev[claim.id],
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                            >
                              {showAllCampusLost
                                ? `Show Only ${claim.claimantName}'s (${studentLostItems.length})`
                                : `Show All Campus Lost Items (${lostReports.length})`}
                            </button>
                          )}
                        </div>
                      </div>

                      {rankedStudentLost.length === 0 ? (
                        <div className="text-xs text-slate-500 bg-white/80 rounded-lg px-3 py-2 border border-slate-200/70">
                          No active lost item reports currently open in the directory. Approving will resolve the Found item directly.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {rankedStudentLost.map(({ lostItem, similarity, hammingDistance }) => {
                            const isAttached = effectiveLostItemId === lostItem.id;
                            const wasAttachedByStudent =
                              claim.linkedLostItemId === lostItem.id;
                            const isScanned = Boolean(claimHashScannedMap[claim.id]);

                            return (
                              <button
                                key={lostItem.id}
                                type="button"
                                onClick={() =>
                                  setClaimLinkedLostIdMap((prev) => ({
                                    ...prev,
                                    [claim.id]: isAttached ? 'NONE' : lostItem.id,
                                  }))
                                }
                                className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                  isAttached
                                    ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                                    : 'bg-white hover:bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={getItemDisplayImage(lostItem)}
                                    alt={lostItem.title}
                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 truncate">
                                        {lostItem.title}
                                      </span>
                                      {wasAttachedByStudent && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                          Attached by Student
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-600 truncate">
                                      Lost by {lostItem.reporterName} • {lostItem.location}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 truncate">
                                      Lost ID: {lostItem.id} • 0x{lostItem.imageHash}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums ${
                                      similarity > 70
                                        ? 'bg-emerald-600 text-white'
                                        : isScanned
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {similarity}% Match (d={hammingDistance})
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold ${
                                      isAttached ? 'text-emerald-800' : 'text-slate-500'
                                    }`}
                                  >
                                    {isAttached
                                      ? '✓ Attached to Co-Resolve'
                                      : 'Click to Attach'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 3: RESOLVED HISTORY DIRECTORY (WITH UNRESOLVE & RESTORE ACTION) */}
      {activeTab === 'resolved_history' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Resolved Items Archive</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Resolved items are removed from the student Found Directory. Click{' '}
                <strong>Unresolve & Restore to Found Directory</strong> to return an item back into active circulation.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              {resolvedItems.length} Resolved {resolvedItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {resolvedItems.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
              <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Resolved Items in Archive</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                When you approve a student claim or mark an item as resolved, it moves out of the Found Directory and is archived here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resolvedItems.map((item) => {
                const isProcessing = processingId === item.id;
                const associatedClaim = claims.find(
                  (c) => c.itemId === item.id && c.status === 'approved'
                );

                return (
                  <motion.div
                    layout
                    key={item.id}
                    className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getItemDisplayImage(item)}
                        alt={item.title}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Resolved & Returned
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            Unified Item ID: {item.id}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            dHash: 0x{item.imageHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    {associatedClaim && (
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-emerald-950">
                            Claimed by: {associatedClaim.claimantName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-700 text-white">
                            {associatedClaim.matchScore}% Hash Match • Linked ID: {associatedClaim.itemId}
                          </span>
                        </div>
                        <div className="text-emerald-800">
                          Proof: &ldquo;{associatedClaim.proofDescription}&rdquo;
                        </div>
                        {associatedClaim.adminNotes && (
                          <div className="text-[11px] text-emerald-700 font-medium pt-0.5">
                            Admin Note: {associatedClaim.adminNotes}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400">
                        Hidden from student Found Directory
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleUnresolve(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`}
                        />
                        {isProcessing
                          ? 'Restoring...'
                          : 'Unresolve & Restore to Found Directory'}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rejected Claims Log */}
          {resolvedClaims.filter((c) => c.status === 'rejected').length > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rejected Claim History
              </h3>
              <div className="space-y-2">
                {resolvedClaims
                  .filter((c) => c.status === 'rejected')
                  .map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{claim.itemTitle}</span>
                        <span className="text-slate-500">
                          {' '}
                          — Claimed by {claim.claimantName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Rejected
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteClaim(claim.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Delete claim record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 4: DATABASE MAINTENANCE */}
      {activeTab === 'database' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'found', 'lost'] as const).map((filterType) => (
                <button
                  key={filterType}
                  type="button"
                  onClick={() => setDbFilter(filterType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dbFilter === filterType
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterType === 'all'
                    ? `All Active Records (${items.filter((i) => i.status !== 'resolved').length})`
                    : filterType === 'found'
                    ? `Active Found Directory (${activeFoundItems.length})`
                    : `Student Lost Reports (${lostReports.length})`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter active records..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-teal-600 focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleExportToCSV}
                disabled={exportingCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                {exportingCsv ? 'Exporting CSV...' : 'Export to CSV'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleSeedClick}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                {seeding ? 'Seeding...' : 'Reset / Seed Demo Records'}
              </motion.button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Item & Category</th>
                    <th className="py-3 px-4">Directory Type</th>
                    <th className="py-3 px-4">Drop-Off / Loss Location</th>
                    <th className="py-3 px-4">64-Bit dHash</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-xs">
                  {filteredDbItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getItemDisplayImage(item)}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{item.title}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.category} •{' '}
                              {item.type === 'found' ? 'Anonymous Drop-off' : item.reporterName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                            item.type === 'found'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                              : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          }`}
                        >
                          {item.type === 'found' ? 'FOUND' : 'LOST'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[220px] truncate">
                        {item.location}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyHash(item.id, item.imageHash)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          title="Copy 64-bit dHash"
                        >
                          {item.imageHash}
                          {copiedHashId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={item.status}
                          onChange={async (e) => {
                            const nextStatus = e.target.value as ItemStatus;
                            await onUpdateItemStatus(item.id, nextStatus);
                            if (nextStatus === 'resolved') {
                              triggerBanner(
                                `"${item.title}" marked as Resolved and moved to Resolved History.`,
                                'success',
                                'resolved_history'
                              );
                              onNotify(
                                'Moved to Resolved Archive',
                                `"${item.title}" is now in Resolved History.`,
                                'success'
                              );
                            } else {
                              onNotify(
                                'Status Updated',
                                `"${item.title}" set to ${nextStatus}.`,
                                'info'
                              );
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none cursor-pointer"
                        >
                          <option value="approved">Approved (Active)</option>
                          <option value="claimed">Claim Pending</option>
                          <option value="resolved">Mark Resolved (Archive)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteItem(item.id);
                            onNotify(
                              'Record Deleted',
                              `"${item.title}" was removed from the database.`,
                              'warning'
                            );
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete item permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredDbItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No active records match your filter. Check the Resolved History tab for archived items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
