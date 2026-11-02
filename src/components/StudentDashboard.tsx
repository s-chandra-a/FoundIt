import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FilePlus2,
  Fingerprint,
  FolderCheck,
  Info,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import {
  BLUEPRINT_CONSTRAINTS,
  CAMPUS_CATEGORIES,
  CAMPUS_LOCATIONS,
  CampusItem,
  HashComparisonMetric,
  ItemCategory,
  ItemClaim,
  UserProfile,
} from '../types';
import {
  comparePerceptualHashes,
  computePerceptualHash,
  hexToBitArray,
  PRESET_CAMPUS_VISUALS,
  renderCampusItemCanvas,
} from '../utils/imageHash';

export type StudentTab = 'directory' | 'image_search' | 'report_item' | 'my_claims';

interface StudentDashboardProps {
  user: UserProfile;
  activeTab: StudentTab;
  setActiveTab: (tab: StudentTab) => void;
  items: CampusItem[];
  claims: ItemClaim[];
  onCreateItem: (item: Omit<CampusItem, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCreateClaim: (claim: Omit<ItemClaim, 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onNotify: (title: string, message: string, variant?: 'success' | 'info' | 'warning') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  activeTab,
  setActiveTab,
  items,
  claims,
  onCreateItem,
  onCreateClaim,
  onDeleteItem,
  onNotify,
}) => {
  // 1. Directory Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // 2. Claim Modal State
  const [claimingItem, setClaimingItem] = useState<CampusItem | null>(null);
  const [claimMatchScore, setClaimMatchScore] = useState<number>(0);
  const [proofText, setProofText] = useState<string>('');
  const [claimSubmitting, setClaimSubmitting] = useState<boolean>(false);

  // 3. Perceptual Image Hash Search State
  const [queryImageUrl, setQueryImageUrl] = useState<string>('');
  const [queryHashHex, setQueryHashHex] = useState<string>('');
  const [queryLabel, setQueryLabel] = useState<string>('');
  const [hashSearchRunning, setHashSearchRunning] = useState<boolean>(false);
  const [hashResults, setHashResults] = useState<
    Array<{ item: CampusItem; metrics: HashComparisonMetric }>
  >([]);
  const [hasSearchedHash, setHasSearchedHash] = useState<boolean>(false);

  // 4. Report Lost Item Form State (Students can ONLY report lost items)
  const [itemTitle, setItemTitle] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<ItemCategory>('Electronics');
  const [itemLocation, setItemLocation] = useState<string>(CAMPUS_LOCATIONS[0]);
  const [itemDate, setItemDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemImageUrl, setItemImageUrl] = useState<string>('');
  const [itemImageHash, setItemImageHash] = useState<string>('');
  const [activePresetKey, setActivePresetKey] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // Active Found Items in Directory — Resolved items are strictly excluded!
  const activeFoundItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.type === 'found' &&
        (item.status === 'approved' || item.status === 'claimed')
    );
  }, [items]);

  const filteredFoundItems = useMemo(() => {
    return activeFoundItems.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.imageHash.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [activeFoundItems, selectedCategory, searchQuery]);

  const myClaims = useMemo(() => {
    return claims.filter(
      (c) =>
        c.claimantId === user.uid ||
        c.claimantName.toLowerCase() === user.displayName.toLowerCase()
    );
  }, [claims, user.uid, user.displayName]);

  const myLostReports = useMemo(() => {
    return items.filter(
      (i) =>
        i.type === 'lost' &&
        i.status !== 'resolved' &&
        (i.reporterId === user.uid ||
          i.reporterName.toLowerCase() === user.displayName.toLowerCase())
    );
  }, [items, user.uid, user.displayName]);

  const lostReportsOnCampus = useMemo(() => {
    return items.filter(
      (i) => i.type === 'lost' && i.status !== 'rejected' && i.status !== 'resolved'
    );
  }, [items]);

  const handleCopyHash = (id: string, hashHex: string) => {
    navigator.clipboard?.writeText(`0x${hashHex}`);
    setCopiedHashId(id);
    onNotify('Perceptual Hash Copied', `Copied 0x${hashHex} to clipboard.`, 'info');
    setTimeout(() => {
      setCopiedHashId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  // Load a query image for Image Hash Search
  const loadQueryImageForHash = async (dataUrl: string, label: string) => {
    const computed = await computePerceptualHash(dataUrl);
    setQueryImageUrl(computed.previewDataUrl);
    setQueryHashHex(computed.hashHex);
    setQueryLabel(label);
    setHasSearchedHash(false);
    setHashResults([]);
    onNotify(
      'Image Fingerprint Computed',
      `Generated 64-bit dHash 0x${computed.hashHex} for "${label}". Click Compare to rank matches.`,
      'info'
    );
  };

  const handleQueryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await loadQueryImageForHash(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunImageHashSearch = async () => {
    if (!queryHashHex) return;
    setHashSearchRunning(true);

    try {
      const candidates = activeFoundItems.map((it) => ({
        id: it.id,
        imageHash: it.imageHash,
      }));

      let metricsList: HashComparisonMetric[] = [];
      try {
        const response = await fetch('/api/hash-compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryHash: queryHashHex,
            candidates,
          }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { results: HashComparisonMetric[] };
          metricsList = payload.results;
        }
      } catch {
        // Fallback to local deterministic Hamming distance comparison
      }

      if (metricsList.length === 0) {
        metricsList = candidates
          .map((c) => {
            const comp = comparePerceptualHashes(queryHashHex, c.imageHash);
            return {
              id: c.id,
              imageHash: c.imageHash,
              hammingDistance: comp.hammingDistance,
              matchingBits: comp.matchingBits,
              totalBits: comp.totalBits,
              matchPercentage: comp.matchPercentage,
            };
          })
          .sort((a, b) => b.matchPercentage - a.matchPercentage);
      }

      const joined = metricsList
        .map((m) => {
          const item = activeFoundItems.find((it) => it.id === m.id);
          return item ? { item, metrics: m } : null;
        })
        .filter((entry): entry is { item: CampusItem; metrics: HashComparisonMetric } => entry !== null);

      setHashResults(joined);
      setHasSearchedHash(true);
      const topScore = joined[0]?.metrics.matchPercentage ?? 0;
      onNotify(
        'Hash Comparison Complete',
        `Evaluated ${joined.length} active found items. Top match score: ${topScore}%.`,
        'success'
      );
    } finally {
      setHashSearchRunning(false);
    }
  };

  // Report Lost Item Form Handlers
  const handleReportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const computed = await computePerceptualHash(reader.result);
        setItemImageUrl(computed.previewDataUrl);
        setItemImageHash(computed.hashHex);
        setActivePresetKey(null);
        onNotify(
          'Photo Hashed',
          `Generated 64-bit signature 0x${computed.hashHex} from uploaded photo.`,
          'info'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectReportPreset = async (presetKey: string) => {
    const preset = PRESET_CAMPUS_VISUALS.find((p) => p.key === presetKey);
    if (!preset) return;
    setActivePresetKey(presetKey);
    const rawUrl = renderCampusItemCanvas(presetKey, 'query');
    const computed = await computePerceptualHash(rawUrl);
    setItemImageUrl(computed.previewDataUrl);
    setItemImageHash(computed.hashHex);
    setItemTitle(`Lost ${preset.defaultTitle}`);
    setItemCategory(preset.category);
    setItemLocation(preset.defaultLocation);
    setItemDescription(preset.defaultDescription);
    onNotify(
      'Template Loaded & Hashed',
      `Pre-filled "${preset.label}" with 64-bit perceptual hash 0x${computed.hashHex}.`,
      'info'
    );
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(null);

    let finalImageUrl = itemImageUrl;
    let finalImageHash = itemImageHash;

    if (!finalImageUrl || !finalImageHash) {
      const fallbackRaw = renderCampusItemCanvas('macbook_sleeve', 'query');
      const computed = await computePerceptualHash(fallbackRaw);
      finalImageUrl = computed.previewDataUrl;
      finalImageHash = computed.hashHex;
    }

    const cleanTitle = itemTitle.trim().slice(0, BLUEPRINT_CONSTRAINTS.TITLE_MAX_LEN);
    const cleanLocation = itemLocation.trim().slice(0, BLUEPRINT_CONSTRAINTS.LOCATION_MAX_LEN);
    const cleanDesc = itemDescription.trim().slice(0, BLUEPRINT_CONSTRAINTS.DESCRIPTION_MAX_LEN);

    if (cleanTitle.length < BLUEPRINT_CONSTRAINTS.TITLE_MIN_LEN) return;
    if (cleanDesc.length < BLUEPRINT_CONSTRAINTS.DESCRIPTION_MIN_LEN) return;

    setReportSubmitting(true);
    try {
      const newId = `item_lost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await onCreateItem({
        id: newId,
        type: 'lost',
        title: cleanTitle,
        category: itemCategory,
        location: cleanLocation,
        dateOccurred: itemDate,
        description: cleanDesc,
        imageDataUrl: finalImageUrl.slice(0, BLUEPRINT_CONSTRAINTS.IMAGE_DATA_URL_MAX_LEN),
        imageHash: finalImageHash,
        status: 'approved',
        reporterId: user.uid,
        reporterName: user.displayName,
        visibility: 'campus',
      });

      const msg = `Lost item report "${cleanTitle}" filed with 64-bit hash 0x${finalImageHash}. You can now match it in Image Hash Search.`;
      setReportSuccess(msg);
      onNotify('Lost Item Report Filed', msg, 'success');
      setItemTitle('');
      setItemDescription('');
      setItemImageUrl('');
      setItemImageHash('');
      setActivePresetKey(null);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenClaimModal = (item: CampusItem, matchScore = 0) => {
    const existingClaim = myClaims.find((c) => c.itemId === item.id);
    if (existingClaim) {
      onNotify(
        'Claim Already Submitted',
        `You already have a ${existingClaim.status} claim for "${item.title}".`,
        'info'
      );
      setActiveTab('my_claims');
      return;
    }
    setClaimingItem(item);
    setClaimMatchScore(matchScore);
    setProofText('');
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem) return;
    const cleanProof = proofText.trim().slice(0, BLUEPRINT_CONSTRAINTS.PROOF_MAX_LEN);
    if (cleanProof.length < BLUEPRINT_CONSTRAINTS.PROOF_MIN_LEN) return;

    setClaimSubmitting(true);
    try {
      const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await onCreateClaim({
        id: claimId,
        itemId: claimingItem.id,
        itemTitle: claimingItem.title.slice(0, BLUEPRINT_CONSTRAINTS.TITLE_MAX_LEN),
        claimantId: user.uid,
        claimantName: user.displayName.slice(0, 100),
        proofDescription: cleanProof,
        matchScore: claimMatchScore,
        status: 'pending',
        adminNotes: '',
        visibility: 'campus',
      });
      onNotify(
        'Ownership Claim Submitted',
        `Your claim for "${claimingItem.title}" is now pending Campus Security verification.`,
        'success'
      );
      setClaimingItem(null);
      setActiveTab('my_claims');
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Vibrant Top KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
            activeTab === 'directory'
              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-500">Available Found Items</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {activeFoundItems.length}
          </p>
          <p className="text-[11px] text-[#1D4ED8] font-medium mt-1">Browse active directory →</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image_search')}
          className={`text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
            activeTab === 'image_search'
              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-500">Perceptual Hash Engine</p>
          <p className="text-2xl font-bold text-[#1D4ED8] font-mono tabular-nums mt-1">
            64-Bit dHash
          </p>
          <p className="text-[11px] text-[#1D4ED8] font-medium mt-1">Run visual similarity search →</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report_item')}
          className={`text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
            activeTab === 'report_item'
              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-500">My Lost Reports</p>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {myLostReports.length}
          </p>
          <p className="text-[11px] text-slate-600 font-medium mt-1">File a new loss report →</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_claims')}
          className={`text-left p-5 rounded-xl border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
            activeTab === 'my_claims'
              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-medium text-slate-500">My Submitted Claims</p>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {myClaims.length}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Check verification status →</p>
        </button>
      </div>

      {/* TAB 1: FOUND ITEMS DIRECTORY (Excludes Resolved Items) */}
      <AnimatePresence mode="wait">
        {activeTab === 'directory' && (
          <motion.div
            key="student-directory"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6"
          >
            {/* Search & Segmented Category Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search active found items by title, drop-off desk, description, or 16-hex hash..."
                    className="w-full pl-10 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('image_search')}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] rounded-lg shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Search by Perceptual Image Hash</span>
                </button>
              </div>

              {/* Interactive Category Filter Controls */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['All', ...CAMPUS_CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                        selectedCategory === cat
                          ? 'bg-[#1D4ED8] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  Showing {filteredFoundItems.length} unclaimed/active found items
                </span>
              </div>
            </div>

            {/* Found Items Grid */}
            {filteredFoundItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <p className="text-base font-semibold text-slate-900">
                  No matching unclaimed found items in the directory
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Note: Items that have already been verified and resolved are moved out of the public Found Directory.
                  You can file a Lost Item Report or run an Image Hash Search.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('report_item')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 rounded-lg transition-all cursor-pointer"
                  >
                    File Lost Item Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFoundItems.map((item) => {
                  const alreadyClaimedByMe = myClaims.some((c) => c.itemId === item.id);
                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-150 group"
                    >
                      <div>
                        <div className="aspect-4/3 bg-slate-100 border-b border-slate-200 overflow-hidden relative">
                          <img
                            src={item.imageDataUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        </div>

                        <div className="p-5 space-y-2.5">
                          {/* Unboxed Metadata Line + Click-to-copy Hash */}
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1D4ED8]">{item.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{item.dateOccurred}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyHash(item.id, item.imageHash)}
                              title="Click to copy 64-bit perceptual hash"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-[#1D4ED8] transition-colors cursor-pointer"
                            >
                              {copiedHashId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>0x{item.imageHash.slice(0, 8)}…</span>
                                </>
                              )}
                            </button>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
                            {item.title}
                          </h3>

                          <p className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40">
                        <span className="text-xs font-medium text-slate-600">
                          {item.status === 'claimed'
                            ? 'Claim Under Review'
                            : 'Held at Collection Desk'}
                        </span>

                        {alreadyClaimedByMe ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab('my_claims')}
                            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            View My Claim →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenClaimModal(item, 0)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 rounded-lg shadow-xs hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Claim This Item
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: PERCEPTUAL IMAGE HASH SEARCH */}
        {activeTab === 'image_search' && (
          <motion.div
            key="student-image-search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              <div className="max-w-3xl space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Perceptual Image Hash Search (64-Bit dHash)
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload a photo of your lost item or select an existing lost report below. Clicking{' '}
                  <strong>Compare Image Hashes</strong> computes the 64-bit luminance gradient hash and ranks all{' '}
                  {activeFoundItems.length} active found items in the directory by percentage of matching bits.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Image Selector / Upload */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="border border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        1. Upload Lost Item Photo
                      </span>
                      <label className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQueryFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Or select from filed Lost Item Reports */}
                    {lostReportsOnCampus.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/80 space-y-2">
                        <span className="block text-xs font-semibold text-slate-800">
                          Or load from Filed Lost Item Reports:
                        </span>
                        <div className="space-y-1.5">
                          {lostReportsOnCampus.map((lostItem) => {
                            const isSelected = queryLabel === lostItem.title;
                            return (
                              <button
                                key={lostItem.id}
                                type="button"
                                onClick={() =>
                                  loadQueryImageForHash(lostItem.imageDataUrl, lostItem.title)
                                }
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between gap-2 transition-all active:scale-[0.99] cursor-pointer border ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-400 text-[#1D4ED8] font-semibold shadow-xs'
                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                                }`}
                              >
                                <span className="truncate">{lostItem.title}</span>
                                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                  0x{lostItem.imageHash.slice(0, 8)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Or select a sample test photo */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <span className="block text-xs font-semibold text-slate-800">
                        Or test with Sample Lost Item Camera Photos:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_CAMPUS_VISUALS.map((preset) => {
                          const targetLabel = `Query: ${preset.label}`;
                          const isSelected = queryLabel === targetLabel;
                          return (
                            <button
                              key={preset.key}
                              type="button"
                              onClick={() => {
                                const url = renderCampusItemCanvas(preset.key, 'query');
                                loadQueryImageForHash(url, targetLabel);
                              }}
                              className={`px-2.5 py-2 text-left text-xs rounded-lg truncate transition-all active:scale-95 cursor-pointer border ${
                                isSelected
                                  ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] font-semibold shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Selected Query Preview Card */}
                  {queryImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-white">
                          <img
                            src={queryImageUrl}
                            alt="Query item"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{queryLabel}</p>
                          <p className="text-[11px] text-slate-500">Computed 64-Bit Perceptual Hash:</p>
                          <p className="text-xs font-mono font-semibold text-[#1D4ED8] bg-white px-2.5 py-1 rounded border border-slate-200">
                            0x{queryHashHex}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunImageHashSearch}
                        disabled={hashSearchRunning}
                        className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] rounded-lg shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {hashSearchRunning ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Comparing 64-Bit Hashes...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>Compare Image Hashes &amp; Rank Matches</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Right: Ranked Hash Comparison Results */}
                <div className="lg:col-span-7 space-y-4">
                  {!hasSearchedHash ? (
                    <div className="border border-slate-200 rounded-xl p-10 text-center space-y-2 bg-slate-50/60">
                      <Fingerprint className="w-8 h-8 text-[#1D4ED8] mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">
                        Select or upload a lost item image on the left
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Click &ldquo;Compare Image Hashes &amp; Rank Matches&rdquo; to calculate Hamming distance against all{' '}
                        {activeFoundItems.length} active found items in the directory.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-600 pb-1 border-b border-slate-200">
                        <span>
                          Ranked Found Items vs Query Hash{' '}
                          <strong className="font-mono text-slate-900">0x{queryHashHex}</strong>
                        </span>
                        <span className="font-mono tabular-nums">
                          {hashResults.length} active items evaluated
                        </span>
                      </div>

                      {hashResults.map(({ item, metrics }, rankIndex) => {
                        const queryBits = hexToBitArray(queryHashHex);
                        const candidateBits = hexToBitArray(item.imageHash);
                        const isStrongMatch = metrics.matchPercentage >= 80;
                        const isModerateMatch =
                          metrics.matchPercentage >= 65 && metrics.matchPercentage < 80;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: rankIndex * 0.03 }}
                            className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md ${
                              isStrongMatch
                                ? 'border-emerald-300 bg-emerald-50/15'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-24 aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                <img
                                  src={item.imageDataUrl}
                                  alt={item.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-mono font-bold text-slate-900">
                                    #{rankIndex + 1}
                                  </span>
                                  <span>·</span>
                                  <span className="font-medium text-slate-700">{item.category}</span>
                                  <span>·</span>
                                  <span className="font-mono">0x{item.imageHash}</span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 font-display truncate">
                                  {item.title}
                                </h3>

                                <p className="text-xs text-slate-600 truncate">{item.location}</p>

                                {/* 32-bit visual sample of the 64-bit comparison */}
                                <div className="flex items-center gap-2 pt-1">
                                  <div className="grid grid-cols-16 gap-0.5 flex-1 max-w-[200px]">
                                    {queryBits.slice(0, 16).map((b, i) => (
                                      <div
                                        key={i}
                                        className={`h-1.5 rounded-xs ${
                                          b === candidateBits[i] ? 'bg-emerald-600' : 'bg-slate-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                                    {metrics.matchingBits}/64 bits · d={metrics.hammingDistance}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                              <div className="text-left sm:text-right">
                                <p
                                  className={`text-lg font-bold font-mono tabular-nums ${
                                    isStrongMatch
                                      ? 'text-emerald-700'
                                      : isModerateMatch
                                      ? 'text-amber-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {metrics.matchPercentage}% Match
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {isStrongMatch
                                    ? 'High Visual Correlation'
                                    : isModerateMatch
                                    ? 'Partial Structural Match'
                                    : 'Low Structural Similarity'}
                                </p>
                              </div>

                              {myClaims.some((c) => c.itemId === item.id) ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('my_claims')}
                                  className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  View My Claim →
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenClaimModal(item, metrics.matchPercentage)}
                                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  Claim with {metrics.matchPercentage}% Match
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: FILE A LOST ITEM REPORT (Student Only Reports Lost Items) */}
        {activeTab === 'report_item' && (
          <motion.div
            key="student-report-lost"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="bg-white border border-slate-200 rounded-xl p-6 lg:p-8 max-w-4xl mx-auto shadow-xs space-y-6"
          >
            <div className="border-b border-slate-200 pb-5 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  File a Campus Lost Item Report
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Register a lost item with a reference image so our 64-bit perceptual hash engine can match it against
                  items turned in across campus.
                </p>
              </div>

              {/* Anonymous Campus Found Drop-Off Policy Notice */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Found an item on campus?</span>{' '}
                  Found items are turned in anonymously at your nearest{' '}
                  <strong>Campus Lost &amp; Found Drop-Box</strong> (Student Union Room 104, Main Library Desk, or
                  Engineering Atrium). Campus Security Administrators log all dropped-off items directly into the Found
                  Directory.
                </div>
              </div>
            </div>

            {reportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{reportSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('image_search')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer"
                >
                  Match in Image Hash Search →
                </button>
              </motion.div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-6">
              {/* Quick Preset Helper for easy testing */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Quick-Fill Sample Lost Item &amp; Compute Perceptual Hash:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CAMPUS_VISUALS.map((preset) => {
                    const isSelected = activePresetKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleSelectReportPreset(preset.key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lost Item Title
                  </label>
                  <input
                    type="text"
                    required
                    minLength={BLUEPRINT_CONSTRAINTS.TITLE_MIN_LEN}
                    maxLength={BLUEPRINT_CONSTRAINTS.TITLE_MAX_LEN}
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g. Lost 14-inch MacBook Pro in Charcoal Sleeve"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as ItemCategory)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#1D4ED8]"
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
                    Last Seen Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    list="student-lost-locations"
                    value={itemLocation}
                    onChange={(e) => setItemLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                  />
                  <datalist id="student-lost-locations">
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Date Lost
                  </label>
                  <input
                    type="date"
                    required
                    value={itemDate}
                    onChange={(e) => setItemDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Description &amp; Identifying Features
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={BLUEPRINT_CONSTRAINTS.DESCRIPTION_MIN_LEN}
                  maxLength={BLUEPRINT_CONSTRAINTS.DESCRIPTION_MAX_LEN}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Describe color, brand, stickers, case details, or approximate time..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              {/* Image Upload & Live Computed Perceptual Hash */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="sm:col-span-4">
                  {itemImageUrl ? (
                    <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={itemImageUrl}
                        alt="Lost item preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-4/3 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                      <span>No reference photo selected</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all cursor-pointer inline-flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Reference Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReportFileUpload}
                        className="hidden"
                      />
                    </label>
                    {itemImageHash && (
                      <span className="text-xs font-mono text-[#1D4ED8] bg-white px-3 py-1.5 rounded-lg border border-blue-200 font-semibold">
                        64-Bit dHash: 0x{itemImageHash}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Uploading a reference photo computes a 64-bit perceptual difference hash (dHash) so your lost report
                    can be matched against anonymous found drop-offs.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  {reportSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Filing Loss Report...</span>
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="w-4 h-4" />
                      <span>Submit Lost Item Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 4: MY CLAIMS & LOST ITEM REPORTS */}
        {activeTab === 'my_claims' && (
          <motion.div
            key="student-my-claims"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-8"
          >
            {/* Student Claims Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  My Ownership Claims &amp; Verification Status ({myClaims.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status updates and pickup instructions from Campus Security.
                </p>
              </div>

              {myClaims.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg space-y-2">
                  <FolderCheck className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">You have not raised any claims yet</p>
                  <p className="text-xs text-slate-500">
                    Browse the Found Directory or run an Image Hash Search to claim a recovered item.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                  {myClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono">{claim.id}</span>
                          <span>·</span>
                          {claim.matchScore > 0 ? (
                            <span className="font-mono font-semibold text-[#1D4ED8]">
                              Image Hash Match: {claim.matchScore}%
                            </span>
                          ) : (
                            <span>Direct Directory Claim</span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 font-display">
                          {claim.itemTitle}
                        </h3>

                        <p className="text-xs text-slate-600">
                          <span className="font-medium text-slate-800">Submitted Proof:</span>{' '}
                          {claim.proofDescription}
                        </p>

                        {claim.adminNotes && (
                          <div className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-lg border border-emerald-200 mt-2">
                            <span className="font-semibold">Campus Security Pickup Note:</span>{' '}
                            {claim.adminNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {claim.status === 'approved' && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Resolved · Approved for Pickup</span>
                          </div>
                        )}
                        {claim.status === 'pending' && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                            <Clock className="w-4 h-4" />
                            <span>Pending Admin Review</span>
                          </div>
                        )}
                        {claim.status === 'rejected' && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                            <XCircle className="w-4 h-4" />
                            <span>Claim Declined</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student's Filed Lost Item Reports */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  My Filed Lost Item Reports ({myLostReports.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lost items you have registered for perceptual hash comparison.
                </p>
              </div>

              {myLostReports.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No lost item reports filed under your account yet.</p>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                  {myLostReports.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.imageDataUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-[#1D4ED8]">{item.category}</span>
                            <span>·</span>
                            <span className="font-mono">0x{item.imageHash}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await loadQueryImageForHash(item.imageDataUrl, item.title);
                            setActiveTab('image_search');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 active:scale-95 rounded-lg transition-all cursor-pointer"
                        >
                          Search Matches
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          Withdraw Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claim Submission Modal */}
      <AnimatePresence>
        {claimingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    Submit Ownership Claim
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{claimingItem.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setClaimingItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <img
                  src={claimingItem.imageDataUrl}
                  alt={claimingItem.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 object-cover rounded border border-slate-200"
                />
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{claimingItem.location}</p>
                  <p className="font-mono text-slate-500">Hash: 0x{claimingItem.imageHash}</p>
                  {claimMatchScore > 0 && (
                    <p className="font-mono font-semibold text-emerald-700">
                      Attached Perceptual Match Score: {claimMatchScore}%
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Proof of Ownership (Serial number, lockscreen description, contents, or markings)
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={BLUEPRINT_CONSTRAINTS.PROOF_MIN_LEN}
                    maxLength={BLUEPRINT_CONSTRAINTS.PROOF_MAX_LEN}
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    placeholder="Provide specific identifying details only the owner would know..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimingItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-95 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {claimSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Claim...</span>
                      </>
                    ) : (
                      <span>Submit Claim for Admin Review</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
