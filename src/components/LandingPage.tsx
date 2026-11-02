import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Fingerprint, Lock, Search, ShieldCheck } from 'lucide-react';
import {
  comparePerceptualHashes,
  computePerceptualHash,
  hexToBitArray,
  PRESET_CAMPUS_VISUALS,
  renderCampusItemCanvas,
} from '../utils/imageHash';

interface LandingPageProps {
  onOpenAuth: (mode: 'student' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [selectedDemoPreset, setSelectedDemoPreset] = useState<string>('macbook_sleeve');
  const [demoData, setDemoData] = useState<{
    foundUrl: string;
    lostUrl: string;
    foundHash: string;
    lostHash: string;
    matchPercentage: number;
    hammingDistance: number;
    matchingBits: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function runLiveHashDemo() {
      const foundCanvasUrl = renderCampusItemCanvas(selectedDemoPreset, 'catalog');
      const lostCanvasUrl = renderCampusItemCanvas(selectedDemoPreset, 'query');
      const [foundComputed, lostComputed] = await Promise.all([
        computePerceptualHash(foundCanvasUrl),
        computePerceptualHash(lostCanvasUrl),
      ]);
      if (!active) return;
      const comparison = comparePerceptualHashes(foundComputed.hashHex, lostComputed.hashHex);
      setDemoData({
        foundUrl: foundComputed.previewDataUrl,
        lostUrl: lostComputed.previewDataUrl,
        foundHash: foundComputed.hashHex,
        lostHash: lostComputed.hashHex,
        matchPercentage: comparison.matchPercentage,
        hammingDistance: comparison.hammingDistance,
        matchingBits: comparison.matchingBits,
      });
    }
    runLiveHashDemo();
    return () => {
      active = false;
    };
  }, [selectedDemoPreset]);

  const foundBits = demoData ? hexToBitArray(demoData.foundHash) : [];
  const lostBits = demoData ? hexToBitArray(demoData.lostHash) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          FoundIt
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a
            href="#how-it-works"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </a>
          <a
            href="#hash-engine"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Hash Engine
          </a>
          <a
            href="#access-modes"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Access Modes
          </a>
          <a
            href="#campus-proof"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Campus Proof
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onOpenAuth('student')}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In to Portal
          </button>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Section: 2-Column Split */}
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Left Column: Proposition & Role Entry Points */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-7 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-5">
                <p className="text-xs font-medium text-slate-500">
                  University Lost &amp; Found Directory · Verified .edu Access · 64-Bit Perceptual Hash Matching
                </p>

                <h1
                  className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 font-display leading-[1.12]"
                  style={{ textWrap: 'balance' }}
                >
                  Recover lost campus items with perceptual image hashing.
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                  FoundIt connects students and campus security in a unified directory. Submit found items, file loss
                  reports, and run bitwise 64-bit image hash comparisons to surface exact visual matches across campus
                  buildings.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('student')}
                    className="px-6 py-3 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Enter Student Portal (.edu)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('admin')}
                    className="px-5 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span>Admin Moderation Sign-In</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Student registration strictly requires a university-issued email address (e.g.{' '}
                  <span className="font-mono text-slate-700">name@stanford.edu</span>). Pre-configured administrator
                  credentials are available inside the Admin Sign-In tab.
                </p>
              </div>
            </motion.div>

            {/* Right Column: Interactive Live Perceptual Image Hash Sandbox */}
            <motion.div
              id="hash-engine"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 font-display">
                    Interactive Perceptual Hash Inspector
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    8×8 luminance gradient dHash · Hamming similarity
                  </p>
                </div>
                <Fingerprint className="w-5 h-5 text-[#1D4ED8] shrink-0" />
              </div>

              {/* Preset Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">
                  Select a campus item to inspect hash resilience across camera angles:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg">
                  {PRESET_CAMPUS_VISUALS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setSelectedDemoPreset(preset.key)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors truncate cursor-pointer ${
                        selectedDemoPreset === preset.key
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {preset.label.split(' ')[0]} {preset.label.split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Visuals */}
              {demoData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={demoData.foundUrl}
                          alt="Found catalog item"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-slate-600">
                        <p className="font-semibold text-slate-900">Found Directory Photo</p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                          0x{demoData.foundHash}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={demoData.lostUrl}
                          alt="Lost student report photo"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-slate-600">
                        <p className="font-semibold text-slate-900">Student Lost Report Photo</p>
                        <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                          0x{demoData.lostHash}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 64-bit Comparison Strip */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Bitwise Similarity ({demoData.matchingBits}/64 matching bits)
                      </span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums text-sm">
                        {demoData.matchPercentage}% Match
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-16 gap-1 pt-1"
                      title="64-bit perceptual gradient matrix comparison (Emerald = matching bit, Amber = shifted bit)"
                    >
                      {foundBits.slice(0, 32).map((bit, idx) => {
                        const matches = bit === lostBits[idx];
                        return (
                          <div
                            key={idx}
                            className={`h-2 rounded-xs ${
                              matches ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Hamming distance: {demoData.hammingDistance} bits · Threshold &ge; 70.0%
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Full-width 4-Column Campus KPI Strip below Hero Split */}
          <div
            id="campus-proof"
            className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">64-Bit dHash</p>
              <p className="text-xs text-slate-500 mt-1">
                9×8 horizontal luminance gradient fingerprint resistant to aspect scaling and compression
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">100% .edu Verified</p>
              <p className="text-xs text-slate-500 mt-1">
                Student accounts restricted strictly to university-issued academic email domains
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">2 Role Modes</p>
              <p className="text-xs text-slate-500 mt-1">
                Isolated Student Claim &amp; Loss Portal and High-Privilege Admin Moderation Console
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">&lt; 50ms Lookup</p>
              <p className="text-xs text-slate-500 mt-1">
                Bitwise XOR Hamming distance ranking across all active campus directory items
              </p>
            </div>
          </div>
        </section>

        {/* How It Works & Role Architecture */}
        <section id="how-it-works" className="border-t border-slate-200 bg-white py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-12">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
                Structured Campus Recovery Workflow
              </h2>
              <p className="text-sm text-slate-600">
                Designed to eliminate unverified claims and cluttered bulletin boards through deterministic image
                fingerprinting and role-separated moderation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <p className="text-xs font-mono font-semibold text-[#1D4ED8]">01. Perceptual Fingerprinting</p>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Every uploaded photo generates a 16-hex hash
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When a student or staff member submits a found item or files a loss report, FoundIt downsamples the
                  image into an 8×8 luminance gradient matrix and computes a 64-bit hexadecimal signature.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono font-semibold text-[#1D4ED8]">02. Ranked Similarity Search</p>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Compare lost and found hashes by match percentage
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Clicking Image Search compares the query item’s hash against every found item in Firestore, computing
                  the exact Hamming distance and returning candidates sorted from highest to lowest percentage match.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-mono font-semibold text-[#1D4ED8]">03. Verified Claim Resolution</p>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Ownership proof &amp; administrator sign-off
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Students attach ownership proof (serial numbers, engravings, lockscreen details) alongside the hash
                  match score. Campus administrators verify the claim and issue pickup instructions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Two Login Modes Breakdown */}
        <section id="access-modes" className="border-t border-slate-200 bg-[#F8FAFC] py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-10">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
                Role-Separated Access Control
              </h2>
              <p className="text-sm text-slate-600">
                Enforced at both the UI layer and Cloud Firestore security rules. Choose your login mode below to begin.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Student Mode Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">MODE 01 · UNIVERSITY STUDENTS</span>
                    <Search className="w-5 h-5 text-[#1D4ED8]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">Student Directory &amp; Claim Portal</h3>
                  <p className="text-sm text-slate-600">
                    Accessible exclusively with a university-provided email address (<span className="font-mono">.edu</span> or{' '}
                    <span className="font-mono">.ac.*</span>).
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Browse approved found items across all campus buildings</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Run Perceptual Image Hash searches ranked by % similarity</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>File detailed lost item reports and drop found items at campus desks</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Raise ownership claims and track live approval status updates</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuth('student')}
                  className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors cursor-pointer"
                >
                  Sign In or Register as Student
                </button>
              </div>

              {/* Admin Mode Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">MODE 02 · CAMPUS SECURITY ADMIN</span>
                    <Lock className="w-5 h-5 text-slate-800" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">
                    Administrator Intake, Claims &amp; Database Maintenance
                  </h3>
                  <p className="text-sm text-slate-600">
                    Single pre-provisioned administrator account (<span className="font-mono">admin@foundit.edu</span>)
                    with highest database privileges.
                  </p>
                  <ul className="space-y-2.5 pt-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Log anonymous found item drop-offs by campus security desk location</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Evaluate student claims using proof details and image hash match %</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Manage Resolved History archive with 1-click Unresolve restoration</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Perform database maintenance, CSV export, and catalog seeding</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenAuth('admin')}
                  className="w-full py-3 px-4 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Open Pre-Made Admin Sign-In
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Credits Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <span className="font-bold text-slate-900 font-display text-sm">FoundIt Campus Directory</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>
              Designed &amp; Developed by <strong className="text-slate-900">Soukaryo Chandra</strong> (Reg. No:{' '}
              <span className="font-mono font-semibold text-slate-900">240953644</span>)
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500">
            <span>School of Computer Engineering, M.I.T., Manipal · FLEXICORE-3131</span>
            <a
              href="/FoundIt_Web_Technology_Project_Report.doc"
              download="FoundIt_Web_Technology_Project_Report.doc"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
            >
              Download Project Report (.doc)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
