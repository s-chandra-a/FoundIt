import fs from 'fs';
import path from 'path';

const screenshots = [
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.54.23_PM_20271ac4.png',
    fig: 'Figure 2.1',
    title: 'Public Landing Page & Interactive 64-Bit Perceptual Hash Inspector',
    caption:
      'Displays the hero value proposition, role-separated entry buttons, and live 64-bit dHash comparison showing 98.4% bitwise similarity (63/64 matching bits, Hamming distance: 1 bit) across camera angles.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.54.39_PM_7bca1779.png',
    fig: 'Figure 2.2',
    title: 'FoundIt Campus Authentication Modal (.edu University Domain Policy)',
    caption:
      'Role-separated Email & Password authentication modal enforcing the .edu / .ac.* university email policy for students, password visibility toggle, and 1-click demo credential population.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.55.01_PM_b641d560.png',
    fig: 'Figure 2.3',
    title: 'Student Portal — Active Found Directory & Sticky Breadcrumb Navigation',
    caption:
      'Displays active unclaimed found items across campus buildings with real-time search, category filter buttons, KPI summary cards, and 16-character hexadecimal dHash badges.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.55.13_PM_28de3e9b.png',
    fig: 'Figure 2.4',
    title: 'Student Portal — Perceptual Image Hash Search (64-Bit dHash Engine)',
    caption:
      'Interactive visual similarity search workspace where students upload a photo of their lost item or select an existing lost report to rank all active found items by bitwise Hamming similarity percentage.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.55.25_PM_f5794190.png',
    fig: 'Figure 2.5',
    title: 'Student Portal — File a Campus Lost Item Report',
    caption:
      'Dedicated student loss reporting form with anonymous found drop-box policy notice, quick-fill hardware preset buttons, and client-side HTML5 Canvas 64-bit perceptual hash generation.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.55.36_PM_623ce12d.png',
    fig: 'Figure 2.6',
    title: 'Student Portal — My Ownership Claims & Verification Status',
    caption:
      'Real-time claim tracking view displaying submitted proof of ownership, verification status badges (Resolved · Approved for Pickup), and Campus Security pickup instructions.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.55.57_PM_8ee5b9d9.png',
    fig: 'Figure 2.7',
    title: 'Admin Console — Log New Found Item into Directory (Anonymous Campus Drop-Off Intake)',
    caption:
      'High-privilege administrator form for logging anonymous found items turned in at designated campus security desks, complete with automatic perceptual hash correlation against active student lost reports.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.56.08_PM_a932f6a2.png',
    fig: 'Figure 2.8',
    title: 'Admin Console — Claim Verification Queue',
    caption:
      'Administrator claim moderation panel where pending student claims are evaluated against proof descriptions and perceptual hash match scores before being approved and moved to Resolved History.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.56.18_PM_92e040f1.png',
    fig: 'Figure 2.9',
    title: 'Admin Console — Resolved History Archive & Unresolve Action',
    caption:
      'Dedicated Resolved Items Archive housing items removed from the active Found Directory, equipped with an "Unresolve & Restore to Found Directory" button to return items to active circulation if needed.',
  },
  {
    file: 'public/assets/aistudio/Screenshot_2026-11-02_at_2.56.28_PM_04398606.png',
    fig: 'Figure 2.10',
    title: 'Admin Console — Database Maintenance & Client-Side Export to CSV',
    caption:
      'Comprehensive database management table featuring directory type filters, search bar, 1-click Export to CSV for record keeping, Reset / Seed Demo Records, inline status controls, and record deletion.',
  },
];

const embeddedScreenshotsHtml = screenshots
  .map((shot) => {
    const absPath = path.resolve(process.cwd(), shot.file);
    let imgTag = '';
    if (fs.existsSync(absPath)) {
      const base64 = fs.readFileSync(absPath).toString('base64');
      imgTag = `<img src="data:image/png;base64,${base64}" alt="${shot.title}" style="width:100%; max-width:620px; height:auto; border:1px solid #CBD5E1; border-radius:6px; display:block; margin:8px auto;" />`;
    } else {
      imgTag = `<p style="color:#DC2626;">[Image not found at ${shot.file}]</p>`;
    }

    return `
      <div style="margin: 18pt 0; page-break-inside: avoid; border: 1px solid #E2E8F0; padding: 10pt; background-color: #F8FAFC;">
        <p style="font-weight: bold; font-size: 11pt; color: #0F172A; margin: 0 0 6pt 0; text-align: center;">
          ${shot.fig}: ${shot.title}
        </p>
        <div style="text-align: center;">
          ${imgTag}
        </div>
        <p style="font-size: 9.5pt; color: #475569; margin: 6pt 0 0 0; text-align: justify;">
          <strong>Caption:</strong> ${shot.caption}
        </p>
      </div>
    `;
  })
  .join('\n');

const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>FoundIt - Web Technology Project Report (FLEXICORE-3131) - Soukaryo Chandra (240953644)</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 1in 1in 1in 1in;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000;
    }
    h1, h2, h3, h4 {
      font-family: "Times New Roman", Times, serif;
      color: #000000;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    h1 {
      font-size: 16pt;
      font-weight: bold;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
    }
    h3 {
      font-size: 12.5pt;
      font-weight: bold;
    }
    p {
      margin-top: 0pt;
      margin-bottom: 8pt;
      text-align: justify;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0 14pt 0;
    }
    th, td {
      border: 1px solid #000000;
      padding: 6pt 8pt;
      vertical-align: top;
      font-size: 11pt;
      text-align: left;
    }
    th {
      background-color: #F1F5F9;
      font-weight: bold;
    }
    pre {
      font-family: "Courier New", Courier, monospace;
      font-size: 9.5pt;
      background-color: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 8pt;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.35;
      margin: 8pt 0 12pt 0;
    }
    ul, ol {
      margin-top: 4pt;
      margin-bottom: 10pt;
    }
    li {
      margin-bottom: 4pt;
      text-align: justify;
    }
    .cover-page {
      text-align: center;
      page-break-after: always;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <p style="text-align: center; font-size: 18pt; font-weight: bold; margin-top: 36pt; margin-bottom: 24pt; letter-spacing: 0.5pt;">
      FOUNDIT: CAMPUS LOST &amp; FOUND DIRECTORY WITH 64-BIT PERCEPTUAL IMAGE HASHING
    </p>

    <p style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 6pt;">
      WEB TECHNOLOGY PROJECT REPORT, V SEM. BTech (Computer Science &amp; Engineering)
    </p>
    <p style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 36pt;">
      FLEXICORE-3131
    </p>

    <p style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 6pt;">
      SUBMITTED TO
    </p>
    <p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 60pt;">
      SCHOOL OF COMPUTER ENGINEERING, M.I.T., MANIPAL
    </p>

    <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 10pt;">
      By
    </p>
    <p style="text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 48pt;">
      Soukaryo Chandra (Reg. No: 240953644)
    </p>

    <p style="text-align: center; font-size: 12pt; margin-bottom: 8pt;">
      <strong>Under the guidance of:</strong> Department of Computer Science &amp; Engineering Faculty
    </p>
    <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-top: 24pt;">
      November, 2026
    </p>
  </div>

  <!-- TEAM DETAILS AND WORK SPLIT -->
  <h2>Team Details and Work Split</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 6%;">Sl.</th>
        <th style="width: 24%;">Name</th>
        <th style="width: 16%;">Reg. No.</th>
        <th style="width: 38%;">Modules / Pages designed</th>
        <th style="width: 16%;">Signature</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><strong>Soukaryo Chandra</strong></td>
        <td><strong>240953644</strong></td>
        <td>
          1. <strong>Public Landing Page, University Authentication (.edu) &amp; Student Portal</strong> (Found Directory, 64-Bit Perceptual Image Hash Search, Report Lost Item &amp; My Claims Status)<br/><br/>
          2. <strong>Campus Security Admin Console</strong> (Anonymous Found Drop-Off Intake, Claim Verification, Resolved History Archive with Unresolve Action &amp; Database Maintenance with CSV Export)
        </td>
        <td><em>Soukaryo Chandra</em><br/>(Digital-Sign)</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 1: PROJECT OVERVIEW -->
  <h1>1. Project Overview</h1>
  <p>
    <strong>FoundIt</strong> is a full-stack, cross-platform web application built using React 19 [1], Tailwind CSS v4 [2], Framer Motion, Node.js (Express) [3], and Google Firebase (Authentication and Cloud Firestore) [4] to modernize university lost-and-found operations. In large university campuses, students frequently misplace essential personal and academic belongings such as laptops, graphing calculators, university ID cards, laboratory journals, and insulated water bottles. Traditional recovery channels rely on unorganized physical drop-boxes, fragmented messaging groups, or paper registers that lack visual search capabilities and structured ownership verification. FoundIt unifies the entire recovery lifecycle into a clean, bloatware-free, role-separated web portal where students can browse verified found items, file lost item reports, and execute automated <strong>64-bit Perceptual Difference Hash (dHash)</strong> [5] visual similarity searches.
  </p>
  <p>
    The architecture enforces strict role-based access control (RBAC) across two distinct authentication modes: a <strong>University Student Portal</strong> restricted exclusively to verified academic email domains (<code>.edu</code> and <code>.ac.*</code>), and a <strong>Highest-Privilege Campus Security Admin Console</strong> provisioned with a dedicated administrator account (<code>admin@foundit.edu</code>). Students who find items on campus drop them off anonymously at designated campus security desks, where administrators log the item along with its submission desk location and generate its 64-bit hexadecimal visual fingerprint using the HTML5 Canvas 2D API [6]. When a student claim is verified and approved by an administrator, the item automatically transitions out of the active Found Directory into a dedicated <strong>Resolved History Archive</strong>, ensuring the public directory remains clutter-free while retaining full auditability and one-click CSV export for campus security record keeping.
  </p>

  <h2>1.1 Purpose of the Website</h2>
  <p>
    The primary purpose of <strong>FoundIt</strong> is to eliminate the inefficiency, false claims, and manual overhead of traditional university lost-and-found desks by introducing deterministic computer-vision image hashing and structured claim verification. Instead of scrolling through hundreds of text-only notices, students can upload a reference photo of their lost belonging and immediately rank all active found items by bitwise visual similarity percentage using a 64-bit luminance gradient hash (<code>dHash</code>) [5]. Furthermore, by enforcing anonymous campus drop-offs for found items and requiring verifiable proof of ownership (such as serial numbers, etchings, or lock-screen details) before Campus Security approves a claim, the platform safeguards student privacy and prevents unauthorized item collection.
  </p>

  <h2>1.2 Objectives</h2>
  <ul>
    <li><strong>Role-Separated Campus Access:</strong> Provide two isolated login modes—<strong>Student Mode</strong> (restricted to university-issued <code>.edu</code> and <code>.ac.*</code> email addresses) and <strong>Admin Mode</strong> (pre-configured highest-privilege Campus Security account)—using Firebase Email/Password Authentication [4].</li>
    <li><strong>64-Bit Perceptual Image Hashing (dHash) Search Engine:</strong> Compute a 16-character hexadecimal fingerprint from a <code>9&times;8</code> grayscale luminance gradient matrix for every uploaded item image [5, 6] and rank candidate matches by bitwise Hamming distance similarity percentage.</li>
    <li><strong>Anonymous Found Item Drop-Off Logging:</strong> Enable administrators to log found items turned in anonymously at campus collection desks (Student Union Room 104, Main Library Desk, Engineering Hall Reception, etc.) and automatically correlate their image hashes against active student lost reports.</li>
    <li><strong>Student Lost Item Reporting &amp; Claim Tracking:</strong> Allow students to file structured Lost Item Reports, submit ownership claims with supporting proof, and monitor real-time verification status updates and pickup instructions.</li>
    <li><strong>Resolved History Archive &amp; Unresolve Restoration:</strong> Automatically remove approved/resolved items from the active Found Directory and archive them in the Admin <strong>Resolved History</strong> tab, complete with an <strong>Unresolve &amp; Restore to Found Directory</strong> action if an item must be returned to active circulation.</li>
    <li><strong>Database Maintenance &amp; Client-Side CSV Export:</strong> Provide administrators with full catalog search, inline status management, 1-click demo catalog seeding, and client-side <strong>Export to CSV</strong> download for institutional record keeping [7].</li>
  </ul>

  <h2>1.3 Target Users</h2>
  <ul>
    <li><strong>University Students, Researchers, and Faculty:</strong> Primary users who sign in with their university-provided email addresses to search the active Found Directory, run perceptual image hash comparisons, file lost item reports, and track ownership claims.</li>
    <li><strong>Campus Security &amp; Lost-and-Found Administrators:</strong> Administrative staff who log anonymous found item drop-offs, evaluate student ownership claims, issue pickup instructions, manage the Resolved History archive, and export audit logs to CSV.</li>
    <li><strong>Users with Special &amp; Accessibility Needs (WCAG 2.1 Compliance [8]):</strong>
      <ul>
        <li><em>Screen-Reader &amp; Assistive Technology Users:</em> Semantic HTML5 landmarks (<code>&lt;header&gt;</code>, <code>&lt;aside&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;footer&gt;</code>), descriptive <code>aria-label</code> attributes on icon controls, and structured form labels.</li>
        <li><em>Color-Blind &amp; Low-Vision Users:</em> High-contrast daylight surfaces (<code>#F8FAFC</code> background with <code>#0F172A</code> ink exceeding 14:1 contrast ratio) and dual-encoded status badges that pair color with explicit icons and text labels (e.g., Checkmark + "Resolved &middot; Approved for Pickup").</li>
        <li><em>Mobile-Only Campus Users:</em> Fully responsive viewport architecture with a collapsible mobile navigation drawer and touch-friendly action targets for students walking between lecture halls.</li>
      </ul>
    </li>
  </ul>

  <h2>1.4 Site Map</h2>
  <p>
    The website follows a hierarchical, role-aware Single-Page Application (SPA) architecture where all views are designed and implemented by <strong>Soukaryo Chandra (Reg. No: 240953644)</strong>:
  </p>
  <pre>
FoundIt Root Application (App.tsx) — Designed by Soukaryo Chandra (240953644)
│
├── 1. Public Unauthenticated Layer
│   ├── Landing Page (LandingPage.tsx)
│   │   ├── Hero Section &amp; Interactive 64-Bit Perceptual Hash Inspector
│   │   ├── 4-Column Campus KPI Strip (#campus-proof)
│   │   ├── 3-Step Campus Recovery Workflow (#how-it-works)
│   │   ├── Role-Separated Access Control Breakdown (#access-modes)
│   │   └── Academic Credits &amp; Report Download Footer
│   └── Authentication Modal (AuthModal.tsx)
│       ├── Student Portal Sign-In &amp; Registration (.edu / .ac.* Domain Enforced)
│       └── Admin Console Sign-In (Pre-Configured Highest Privilege Account)
│
├── 2. Authenticated Student Portal (StudentDashboard.tsx)
│   ├── Tab 2.1: Found Directory (Search, Category Filter Pills, Active Item Grid &amp; Claim Modal)
│   ├── Tab 2.2: Perceptual Image Hash Search (Photo Upload, 64-Bit Bitwise Matrix &amp; Ranked Matches)
│   ├── Tab 2.3: Report Lost Item (Anonymous Drop-Box Notice, Preset Hash Loader &amp; Loss Form)
│   └── Tab 2.4: My Claims &amp; Status (Live Claim Status Badges &amp; Campus Security Pickup Notes)
│
└── 3. Authenticated Admin Console (AdminDashboard.tsx)
    ├── Tab 3.1: Log Found Item (Anonymous Drop-Off Intake &amp; Live Lost-Report Hash Correlation)
    ├── Tab 3.2: Claim Verification (Pending Claims Queue, Pickup Notes &amp; Approve/Reject Actions)
    ├── Tab 3.3: Resolved History (Archived Resolved Items &amp; "Unresolve &amp; Restore" Action)
    └── Tab 3.4: Database Maintenance (Active Record Filter, Export to CSV, Seed &amp; Delete Controls)
  </pre>

  <h2>1.5 Tools and Technologies</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 32%;">Item</th>
        <th style="width: 68%;">Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>HTML version</strong></td>
        <td>HTML5 (Semantic Landmarks, HTML5 <code>&lt;canvas&gt;</code> 2D API for Perceptual Hashing, and FileReader API) [6]</td>
      </tr>
      <tr>
        <td><strong>CSS framework and version</strong></td>
        <td>Tailwind CSS v4.1 (<code>@tailwindcss/vite</code>) with custom typography variables and responsive grid utilities [2]</td>
      </tr>
      <tr>
        <td><strong>JavaScript / TypeScript &amp; Libraries</strong></td>
        <td>TypeScript 5.8, React 19.0 (Functional Components &amp; Hooks) [1], Motion (Framer Motion v12 for micro-interactions), Lucide React Icons</td>
      </tr>
      <tr>
        <td><strong>Data source (static / JSON / API)</strong></td>
        <td>Google Cloud Firestore (NoSQL real-time document database with <code>firestore.rules</code> RBAC) [4], Firebase Authentication (Email/Password), and Node.js Express REST API (<code>/api/hash-compare</code>, <code>/api/state</code>) exchanging JSON payloads [3]</td>
      </tr>
      <tr>
        <td><strong>IDE and Environment used</strong></td>
        <td>Visual Studio Code, Node.js v22 LTS Runtime, Vite 6.2 Build System, <code>tsx</code> TypeScript execution engine, ESLint with <code>@firebase/rules-unit-testing</code></td>
      </tr>
      <tr>
        <td><strong>Accessibility Guidelines for Users with Disabilities</strong></td>
        <td>W3C WCAG 2.1 Level AA [8]: High-contrast daylight palette (&gt;14:1 primary text contrast), keyboard-navigable forms and modals, password reveal toggle buttons, non-color-dependent status badges, and responsive touch targets</td>
      </tr>
      <tr>
        <td><strong>Testing tools (Lighthouse, WAVE etc.)</strong></td>
        <td>Google Chrome DevTools &amp; Lighthouse (Performance, Accessibility, and Best Practices auditing), TypeScript Compiler (<code>tsc --noEmit</code>), and Firebase Rules Linter (<code>npx eslint firestore.rules</code>)</td>
      </tr>
    </tbody>
  </table>

  <h2>1.5 Common Design Followed by the Team</h2>
  <p>
    To ensure visual cohesion, high scannability, and zero visual bloat across all public and authenticated views, a unified design system was established and strictly followed across every component:
  </p>
  <ul>
    <li><strong>Semantic Layout &amp; Sticky Navigation Shell:</strong> Every authenticated page shares a fixed left vertical sidebar (<code>256px</code> width on desktop, collapsible drawer on mobile) paired with a pinned top workspace header (<code>fixed top-0 left-0 right-0 md:left-64 z-40</code>). The header displays a 3-level breadcrumb trail (<code>FoundIt / Portal Mode / Active View</code>) where the third breadcrumb on desktop is an interactive dropdown menu for rapid view switching even when scrolled deep down long directory pages.</li>
    <li><strong>High-Craft Daylight Colour Palette:</strong> The interface uses a cool alabaster background canvas (<code>#F8FAFC</code>), pure crisp white elevated cards (<code>#FFFFFF</code>) with subtle <code>1px solid #E2E8F0</code> borders, deep slate ink (<code>#0F172A</code>) for primary headings, academic cobalt blue (<code>#1D4ED8</code>) for primary student actions, teal (<code>#0D9488</code>) for perceptual hash and admin intake highlights, emerald green (<code>#15803D</code>) for verified/resolved states, and amber (<code>#B45309</code>) for pending claims.</li>
    <li><strong>Tri-Font Typographic Hierarchy:</strong> Headings use <strong>Plus Jakarta Sans</strong> (<code>600/700</code> weights) for geometric authority; body copy and form inputs use <strong>Public Sans</strong> for effortless legibility; and all 16-character hexadecimal image hashes, Hamming distances, match percentages, and KPI counters use <strong>JetBrains Mono</strong> with <code>font-variant-numeric: tabular-nums</code> so numerical columns align vertically.</li>
    <li><strong>Common Footer &amp; Dense Tactile Feedback:</strong> Both the public landing page and the authenticated workspace feature a unified footer crediting the developer (<strong>Soukaryo Chandra, Reg. No: 240953644, School of Computer Engineering, M.I.T., Manipal</strong>) alongside a floating bottom-right Toast Notification Stack and in-page confirmation banners that provide immediate visual feedback after every click, hash computation, status change, or CSV export.</li>
  </ul>

  <!-- SECTION 2: STUDENT 1 DETAILS -->
  <div class="page-break"></div>
  <h1>2. Student 1: Soukaryo Chandra (Reg. No: 240953644)</h1>
  <p>
    <strong>Modules / Pages:</strong><br/>
    <strong>Module 1:</strong> Public Landing Page, University Authentication (<code>.edu</code> Domain Verification) &amp; Student Portal (Found Directory, 64-Bit Perceptual Image Hash Search, Report Lost Item &amp; My Claims Status)<br/>
    <strong>Module 2:</strong> Campus Security Admin Console (Log Anonymous Found Item Drop-Offs, Claim Verification, Resolved History Archive with Unresolve Action &amp; Database Maintenance with CSV Export)
  </p>

  <h2>2.1 Module Description</h2>

  <h3>Module 1: Public Landing Page, University Authentication &amp; Student Portal</h3>
  <p>
    <strong>Purpose:</strong> Module 1 serves as the public entry point and the complete student-facing workspace of the FoundIt platform. It educates visitors on how 64-bit perceptual image hashing works, enforces university email authentication, and empowers students to search active found items, run visual similarity queries, report lost items, and track ownership claims.
  </p>
  <ul>
    <li><strong>Main Sections &amp; Features:</strong>
      <ol>
        <li><em>Landing Page &amp; Interactive Perceptual Hash Inspector (<code>LandingPage.tsx</code>):</em> Features a 12-column hero split with an interactive hardware preset switcher that computes real-time 64-bit <code>dHash</code> fingerprints on HTML5 canvases, displaying a 64-cell bitwise comparison matrix, Hamming distance, and match percentage alongside a 4-column Campus KPI strip and Role Breakdown cards.</li>
        <li><em>Campus Authentication Modal (<code>AuthModal.tsx</code>):</em> Provides dedicated tabs for <strong>Student Portal (.edu)</strong> and <strong>Admin Console</strong> sign-in/registration, interactive password visibility toggle buttons, and 1-click demo credential population.</li>
        <li><em>Found Directory Tab (<code>StudentDashboard.tsx</code>):</em> Displays only active, unresolved found items (excluding <code>status === 'resolved'</code> items) in a 3-column responsive card grid with instant keyword/hash filtering, category pills, 1-click hash copying, and a modal to submit ownership claims.</li>
        <li><em>Perceptual Image Hash Search Tab:</em> Allows students to upload a photograph of their lost item (or select an existing lost report) and click <strong>Compare Image Hashes</strong> to rank all active found items by bitwise match percentage.</li>
        <li><em>Report Lost Item Tab &amp; My Claims Tab:</em> Enables students to file new lost item reports (with an informational banner explaining the anonymous campus drop-box policy for found items) and monitor real-time approval status and pickup instructions for their submitted claims.</li>
      </ol>
    </li>
    <li><strong>Dynamic Input, Processing, and Output:</strong>
      <ul>
        <li><em>Input:</em> Student credentials (<code>.edu</code> email &amp; password), uploaded lost item image file (JPEG/PNG/WebP), search keywords, category selection, lost item metadata (title, location, date, description), and ownership claim proof description.</li>
        <li><em>Processing:</em> Client-side HTML5 <code>&lt;canvas&gt;</code> downscales uploaded images to a <code>9&times;8</code> pixel grid, converts RGB pixels to grayscale luminance (<code>Y = 0.299R + 0.587G + 0.114B</code>), compares adjacent horizontal pixels to pack a 64-bit hexadecimal hash [5, 6], and computes bitwise XOR Hamming distance against active catalog hashes via both client-side computation and the Express <code>/api/hash-compare</code> endpoint.</li>
        <li><em>Output:</em> Ranked visual match cards displaying exact similarity percentage (e.g., <code>98.4% Match</code>), 64-bit gradient matrix visualization, persisted Firestore documents in <code>items</code> and <code>claims</code>, and animated toast notifications.</li>
      </ul>
    </li>
  </ul>

  <h3>Module 2: Campus Security Admin Console &amp; Database Maintenance</h3>
  <p>
    <strong>Purpose:</strong> Module 2 provides Campus Security administrators with a high-privilege moderation and inventory management suite to log anonymous found item drop-offs, verify student ownership claims, manage the Resolved History archive, and export records to CSV.
  </p>
  <ul>
    <li><strong>Main Sections &amp; Features:</strong>
      <ol>
        <li><em>Log Found Item Tab (Anonymous Drop-Off Intake — <code>AdminDashboard.tsx</code>):</em> Allows admins to record newly found items turned in anonymously at designated campus collection desks (<code>CAMPUS_DROP_LOCATIONS</code>) with photo upload or hardware preset generation. As soon as an image hash is generated, the panel automatically scans and displays matching student Lost Item Reports (&ge;65% similarity).</li>
        <li><em>Claim Verification Tab:</em> Displays all pending student ownership claims alongside the student's proof description, item thumbnail, and hash match percentage. Admins can enter custom pickup instructions and click <strong>Approve &amp; Mark Resolved</strong> or <strong>Reject Claim</strong>.</li>
        <li><em>Resolved History Archive Tab:</em> Houses all resolved items that have been removed from the active Found Directory. Includes a dedicated <strong>Unresolve &amp; Restore to Found Directory</strong> button on every card that resets the item's status to <code>approved</code> (and any linked claim back to <code>pending</code>), returning it to active student circulation.</li>
        <li><em>Database Maintenance Tab &amp; CSV Export:</em> Features a searchable data table of active records filterable by All, Found, or Lost, inline status dropdown selectors, permanent record deletion, 1-click demo catalog seeding, and an <strong>Export to CSV</strong> button.</li>
      </ol>
    </li>
    <li><strong>Dynamic Input, Processing, and Output:</strong>
      <ul>
        <li><em>Input:</em> Anonymous found item details (title, category, campus drop-off desk location, bin note, photo), claim moderation decisions (Approve/Reject + Admin Pickup Notes), Unresolve commands, and CSV export triggers.</li>
        <li><em>Processing:</em> Updates Cloud Firestore <code>items</code> and <code>claims</code> collections atomically, synchronizes state with the Express backend (<code>/api/state</code>), and serializes all items and claims into RFC-4180 escaped CSV rows prefixed with a UTF-8 Byte Order Mark (<code>\\uFEFF</code>) [7].</li>
        <li><em>Output:</em> Real-time removal of resolved items from the student Found Directory, immediate placement into Resolved History, persistent confirmation banners with quick-navigation links, and instant browser download of <code>foundit-campus-records-YYYY-MM-DD.csv</code>.</li>
      </ul>
    </li>
  </ul>

  <h2>2.2 Design of the Module</h2>
  <p>
    The application employs a dual-tier communication architecture combining <strong>Google Cloud Firestore real-time WebSockets (<code>onSnapshot</code>)</strong> [4] with a <strong>Node.js Express REST API</strong> [3] exchanging <strong>JSON</strong> payloads:
  </p>
  <ol>
    <li><strong>Image Hash Search Request Lifecycle (<code>POST /api/hash-compare</code>):</strong> When a student clicks <em>"Compare Image Hashes &amp; Rank Matches"</em>, the frontend serializes the 16-character query hexadecimal hash and an array of active found item hashes into a JSON payload and dispatches an asynchronous <code>fetch('/api/hash-compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(...) })</code> request. The Express backend parses the JSON body, converts each 16-character hex string into a 64-bit binary vector, computes the Hamming distance (number of differing bits out of 64) and similarity percentage <code>((64 - differingBits) / 64) * 100</code>, sorts the results in descending order of match percentage, and returns a structured JSON response that React renders as ranked similarity cards.</li>
    <li><strong>Database Persistence &amp; Claim Resolution Lifecycle (Cloud Firestore &amp; <code>/api/state</code>):</strong> When a student files a Lost Report or raises a Claim, or when an Admin logs an anonymous Found Item, approves a claim, or clicks <em>"Unresolve &amp; Restore to Found Directory"</em>, the React frontend invokes Firebase SDK methods (<code>setDoc</code>, <code>updateDoc</code>, <code>deleteDoc</code>) against the Cloud Firestore database (<code>ai-studio-45e58299-be20-4f3e-b98c-078e1363afac</code>) and mirrors the snapshot to <code>POST /api/state</code>. Real-time <code>onSnapshot</code> listeners immediately push state diffs to connected clients.</li>
    <li><strong>Client-Side Validation:</strong>
      <ul>
        <li><em>University Email Domain Enforcement:</em> The <code>isUniversityEmail(email)</code> validator verifies that student sign-in and registration emails end with accredited academic suffixes (<code>.edu</code>, <code>.edu.*</code>, <code>.ac.*</code>) before invoking Firebase Auth.</li>
        <li><em>Schema &amp; Image Compression Validation:</em> Form handlers validate required fields, enforce character length bounds defined in <code>BLUEPRINT_CONSTRAINTS</code> (titles 2–120 chars, descriptions 4–1000 chars, proof 5–1000 chars), and compress uploaded item photos on an HTML5 canvas to JPEG quality <code>0.78</code> (max <code>420&times;315px</code>, &lt;90KB) so documents never exceed Firestore size limits.</li>
      </ul>
    </li>
    <li><strong>Server-Side &amp; Security Rules Validation:</strong>
      <ul>
        <li><em>Express API Validation:</em> The Node.js <code>/api/hash-compare</code> route validates that <code>queryHash</code> is a non-empty string and sanitizes hexadecimal characters before bitwise evaluation.</li>
        <li><em>Firestore Security Rules (<code>firestore.rules</code>):</em> Enforces server-side schema and role validation at the database engine level—verifying that students can only create <code>type == 'lost'</code> reports under their own <code>request.auth.uid</code>, while only authenticated administrators (<code>isAdmin()</code>) can create <code>type == 'found'</code> anonymous drop-off items, approve/reject claims, or unresolve archived items.</li>
      </ul>
    </li>
  </ol>

  <h2>2.3 Development of the Module (Code Snippets)</h2>

  <h3>Snippet 1: 64-Bit Perceptual Difference Hash (dHash) &amp; Bitwise Hamming Distance (<code>src/utils/imageHash.ts</code>)</h3>
  <pre>
export async function computePerceptualHash(imageSrc: string): Promise&lt;ComputedImageHash&gt; {
  return new Promise((resolve, reject) =&gt; {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () =&gt; {
      // 1. Downscale image to 9x8 pixels on HTML5 Canvas for 64 horizontal gradient comparisons
      const hashCanvas = document.createElement('canvas');
      hashCanvas.width = 9;
      hashCanvas.height = 8;
      const hashCtx = hashCanvas.getContext('2d')!;
      hashCtx.fillStyle = '#F8FAFC';
      hashCtx.fillRect(0, 0, 9, 8);
      hashCtx.drawImage(img, 0, 0, 9, 8);

      const imgData = hashCtx.getImageData(0, 0, 9, 8).data;
      const gray: number[][] = [];
      for (let y = 0; y &lt; 8; y++) {
        const row: number[] = [];
        for (let x = 0; x &lt; 9; x++) {
          const idx = (y * 9 + x) * 4;
          const lum = Math.round(0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2]);
          row.push(lum);
        }
        gray.push(row);
      }

      // 2. Compute 64 gradient bits (left neighbor &gt;= right neighbor) &amp; pack into 16-hex string
      const bits: number[] = [];
      for (let y = 0; y &lt; 8; y++) {
        for (let x = 0; x &lt; 8; x++) {
          bits.push(gray[y][x] &gt;= gray[y][x + 1] ? 1 : 0);
        }
      }
      let hashHex = '';
      for (let i = 0; i &lt; 64; i += 4) {
        const nibble = (bits[i] &lt;&lt; 3) | (bits[i + 1] &lt;&lt; 2) | (bits[i + 2] &lt;&lt; 1) | bits[i + 3];
        hashHex += nibble.toString(16);
      }
      resolve({ hashHex, bits, luminanceGrid: [], previewDataUrl: hashCanvas.toDataURL('image/jpeg', 0.78) });
    };
    img.onerror = () =&gt; reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
  </pre>

  <h3>Snippet 2: Express Backend Perceptual Hash Comparison Endpoint (<code>server.ts</code>)</h3>
  <pre>
app.post('/api/hash-compare', (req, res) =&gt; {
  const { queryHash, candidates } = req.body as {
    queryHash?: string;
    candidates?: Array&lt;{ id: string; imageHash: string }&gt;;
  };

  if (!queryHash || typeof queryHash !== 'string' || !Array.isArray(candidates)) {
    res.status(400).json({ error: 'Invalid payload: queryHash and candidates array required.' });
    return;
  }

  const results = candidates
    .map((candidate) =&gt; {
      const metrics = computeHammingMetrics(queryHash, candidate.imageHash || '');
      return { id: candidate.id, imageHash: candidate.imageHash, ...metrics };
    })
    .sort((a, b) =&gt; b.matchPercentage - a.matchPercentage);

  res.json({ queryHash, totalCompared: results.length, results });
});
  </pre>

  <h3>Snippet 3: Admin Unresolve Workflow &amp; Client-Side CSV Export (<code>src/App.tsx</code> &amp; <code>src/components/AdminDashboard.tsx</code>)</h3>
  <pre>
// Restore a Resolved Item from Admin Resolved History back to the Active Found Directory
const handleUnresolveItem = async (itemId: string) =&gt; {
  if (!userProfile) return;
  const linkedApprovedClaims = claims.filter((c) =&gt; c.itemId === itemId &amp;&amp; c.status === 'approved');

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
};

// Client-Side Export of Items &amp; Claims to UTF-8 CSV Spreadsheet
const handleExportToCSV = () =&gt; {
  const escapeCsvCell = (val: unknown) =&gt; \`"\${String(val ?? '').replace(/"/g, '""')}"\`;
  const rows: string[] = [
    ['Record Type','ID','Directory Type','Title','Category','Status','Location','Date','64-Bit dHash','Reporter / Claimant','Description / Proof','Linked Item ID','Match Score (%)','Admin Notes']
      .map(escapeCsvCell).join(',')
  ];
  items.forEach((item) =&gt; rows.push(['ITEM', item.id, item.type.toUpperCase(), item.title, item.category, item.status, item.location, item.dateOccurred, item.imageHash, item.reporterName, item.description, '', '', ''].map(escapeCsvCell).join(',')));
  claims.forEach((claim) =&gt; rows.push(['CLAIM', claim.id, 'OWNERSHIP_CLAIM', claim.itemTitle, '', claim.status, '', '', '', claim.claimantName, claim.proofDescription, claim.itemId, claim.matchScore, claim.adminNotes].map(escapeCsvCell).join(',')));

  const blob = new Blob(['\\uFEFF' + rows.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', \`foundit-campus-records-\${new Date().toISOString().split('T')[0]}.csv\`);
  link.click();
};
  </pre>

  <h3>Snippet 4: Cloud Firestore Role-Based Security Rules (<code>firestore.rules</code>)</h3>
  <pre>
match /items/{itemId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn()
                &amp;&amp; isValidCampusItem(incoming())
                &amp;&amp; itemId == incoming().id
                &amp;&amp; (
                  (incoming().reporterId == request.auth.uid &amp;&amp; incoming().type == 'lost'
                   &amp;&amp; (incoming().status == 'pending_approval' || incoming().status == 'approved'))
                  || isAdmin()
                );
  allow update: if isSignedIn()
                &amp;&amp; isValidCampusItem(incoming())
                &amp;&amp; itemId == incoming().id
                &amp;&amp; (isAdmin() || (existing().status == 'approved' &amp;&amp; incoming().status == 'claimed'));
  allow delete: if isAdmin() || (isSignedIn() &amp;&amp; existing().reporterId == request.auth.uid);
}
  </pre>

  <div class="page-break"></div>
  <h2>2.4 Results (Screenshots of the Working Modules)</h2>
  <p>
    The following ten screenshots demonstrate the complete working implementation of <strong>FoundIt</strong> across the Public Landing Page, University Authentication Modal, Student Portal, and Campus Security Admin Console:
  </p>
  ${embeddedScreenshotsHtml}

  <!-- SECTION 4: CONCLUSION AND FUTURE SCOPE -->
  <div class="page-break"></div>
  <h1>4. Conclusion and Future Scope</h1>
  <p>
    In this project, we designed and developed <strong>FoundIt</strong>, a responsive, full-stack campus lost-and-found web application integrating React 19, TypeScript, Tailwind CSS v4, Node.js (Express), and Google Firebase (Authentication and Cloud Firestore). Through building this platform, we gained hands-on engineering experience in client-side computer vision using the HTML5 Canvas 2D API to compute 64-bit Perceptual Difference Hashes (<code>dHash</code>), bitwise Hamming distance similarity ranking, real-time NoSQL state synchronization, and declarative Role-Based Access Control (RBAC) via Cloud Firestore security rules. Separating the workflow into a verified <code>.edu</code> Student Portal (focused on lost item reporting, visual hash search, and claim tracking) and a high-privilege Campus Security Admin Console (handling anonymous drop-off intake, claim verification, Resolved History archiving with unresolve restoration, and CSV record export) produced a clean, practical solution tailored for real university operations.
  </p>
  <p>
    <strong>Future Scope:</strong>
  </p>
  <ul>
    <li><strong>Multi-Angle &amp; Color-Histogram Fusion Hashing:</strong> Combine the 64-bit luminance gradient <code>dHash</code> with a Discrete Cosine Transform (<code>pHash</code>) and HSV color histogram descriptor to further improve matching accuracy when items are photographed under extreme angle rotations.</li>
    <li><strong>Automated Email &amp; Push Alerts:</strong> Integrate automated university email notifications whenever an administrator logs a newly found item whose perceptual hash exceeds an 85% match threshold against an active student Lost Item Report.</li>
    <li><strong>QR-Code Smart Locker Handover:</strong> Generate a one-time encrypted QR code inside the student's approved claim card so verified students can scan their university ID and QR pass at automated campus security smart lockers for 24/7 item retrieval.</li>
  </ul>

  <!-- SECTION 5: REFERENCES -->
  <h1>5. Reference</h1>
  <ol>
    <li>
      <strong>React 19 Official Documentation</strong> — Meta Open Source. <em>"React Reference Overview: Hooks, Components, and State Lifecycle."</em> Available at: <a href="https://react.dev/reference/react">https://react.dev/reference/react</a> (Cited in Sections 1, 1.5, 2.1).
    </li>
    <li>
      <strong>Tailwind CSS v4.0 Documentation</strong> — Tailwind Labs Inc. <em>"Styling with Utility Classes, Responsive Design, and Theme Variables."</em> Available at: <a href="https://tailwindcss.com/docs">https://tailwindcss.com/docs</a> (Cited in Sections 1, 1.5).
    </li>
    <li>
      <strong>Express.js 4.x API Reference</strong> — OpenJS Foundation. <em>"Routing, Middleware, and JSON Request Processing in Node.js."</em> Available at: <a href="https://expressjs.com/en/4x/api.html">https://expressjs.com/en/4x/api.html</a> (Cited in Sections 1, 1.5, 2.2).
    </li>
    <li>
      <strong>Google Firebase Documentation</strong> — Google LLC. <em>"Firebase Authentication &amp; Cloud Firestore Security Rules and Real-Time Listeners."</em> Available at: <a href="https://firebase.google.com/docs/firestore">https://firebase.google.com/docs/firestore</a> (Cited in Sections 1, 1.2, 1.5, 2.2).
    </li>
    <li>
      <strong>Krawetz, N. (2013)</strong> — The Hacker Factor Blog. <em>"Kind of Like That: Perceptual Image Hashing and the Difference Hash (dHash) Algorithm."</em> Available at: <a href="https://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html">https://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html</a> (Cited in Sections 1, 1.1, 1.2, 2.1).
    </li>
    <li>
      <strong>MDN Web Docs: HTML5 Canvas 2D Context API</strong> — Mozilla Corporation. <em>"CanvasRenderingContext2D.drawImage() and getImageData() Pixel Manipulation."</em> Available at: <a href="https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D">https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D</a> (Cited in Sections 1, 1.5, 2.1).
    </li>
    <li>
      <strong>Shafranovich, Y. (2005) — IETF RFC 4180</strong>. <em>"Common Format and MIME Type for Comma-Separated Values (CSV) Files."</em> Internet Engineering Task Force. Available at: <a href="https://datatracker.ietf.org/doc/html/rfc4180">https://datatracker.ietf.org/doc/html/rfc4180</a> (Cited in Sections 1.2, 2.1).
    </li>
    <li>
      <strong>W3C Web Content Accessibility Guidelines (WCAG) 2.1</strong> — World Wide Web Consortium. <em>"Contrast (Minimum), Keyboard Accessible, and Use of Color."</em> Available at: <a href="https://www.w3.org/TR/WCAG21/">https://www.w3.org/TR/WCAG21/</a> (Cited in Sections 1.3, 1.5).
    </li>
    <li>
      <strong>TypeScript 5.8 Handbook</strong> — Microsoft Corporation. <em>"Everyday Types, Interfaces, and Strict Type Checking."</em> Available at: <a href="https://www.typescriptlang.org/docs/handbook/intro.html">https://www.typescriptlang.org/docs/handbook/intro.html</a> (Cited in Section 1.5).
    </li>
    <li>
      <strong>Vite 6 Guide</strong> — Evan You &amp; Vite Contributors. <em>"Next Generation Frontend Tooling and Server Middleware Mode."</em> Available at: <a href="https://vite.dev/guide/">https://vite.dev/guide/</a> (Cited in Section 1.5).
    </li>
  </ol>

</body>
</html>
`;

const rootDocPath = path.resolve(process.cwd(), 'FoundIt_Web_Technology_Project_Report.doc');
const publicDocPath = path.resolve(process.cwd(), 'public/FoundIt_Web_Technology_Project_Report.doc');

fs.writeFileSync(rootDocPath, docHtml, 'utf8');
fs.writeFileSync(publicDocPath, docHtml, 'utf8');
console.log('Successfully generated FoundIt_Web_Technology_Project_Report.doc at root and public/!');
