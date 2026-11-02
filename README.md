# FoundIt — Campus Lost & Found Directory

**Web Technology Project (FLEXICORE-3131) · V Semester B.Tech**  
**School of Computer Engineering, Manipal Institute of Technology (M.I.T.), Manipal**  
**Designed & Developed by:** Soukaryo Chandra (Registration No: `240953644`)

---

## Overview

**FoundIt** is a full-stack, cross-platform desktop and mobile-responsive web application designed for university campuses to streamline lost-and-found recovery. It replaces fragmented campus notice boards with a role-separated directory powered by **64-bit Perceptual Difference Hashing (`dHash`)**, **Firebase Authentication**, **Cloud Firestore**, **React 19**, **Tailwind CSS v4**, and **Node.js (Express)**.

### Key Features

1. **64-Bit Perceptual Image Hashing (`dHash`) & Bitwise Hamming Similarity Search**
   - Every item photograph is downsampled on an HTML5 `<canvas>` to a `9×8` grayscale luminance matrix to compute a 64-bit horizontal gradient signature (`16-character hexadecimal hash`).
   - Clicking **Compare Image Hashes** calculates the bitwise XOR Hamming distance (`64 - differingBits`) against all active found items in the directory and ranks matches by exact similarity percentage.
2. **Role-Separated Authentication (`.edu` Student Portal & Pre-Configured Admin Console)**
   - **Student Mode:** Restricted exclusively to university-issued email addresses (`.edu`, `.ac.*`). Students can browse active found items, run perceptual image hash searches, file lost item reports, and raise ownership claims with status tracking.
   - **Admin Mode:** Single high-privilege Campus Security Administrator account (`admin@foundit.edu`) capable of logging anonymous found item drop-offs by campus desk location, verifying or rejecting ownership claims, managing the **Resolved History** archive (with 1-click **Unresolve & Restore to Found Directory**), and exporting database records to CSV.
3. **Anonymous Campus Drop-Off Policy & Clean Active Directory**
   - Students who find items drop them off anonymously at designated campus security desks. Administrators log these items with the exact submission desk location.
   - Once a student claim is approved and marked **Resolved**, the item is automatically removed from the active Found Directory and archived in **Resolved History**.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 6 |
| **Styling & Motion** | Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion/react`), Lucide Icons |
| **Backend Runtime** | Node.js with Express (`server.ts`, executed via `tsx`) |
| **Cloud Database & Auth** | Firebase Authentication (Email/Password) & Cloud Firestore (`firestore.rules`) |
| **Image Fingerprinting** | HTML5 Canvas 2D Context (`9×8` luminance gradient 64-bit `dHash`) + `/api/hash-compare` |

---

## Prerequisites

Ensure the following tools are installed on your local machine before running the project:

- **Node.js** `v18.18.0` or higher (recommended `v20 LTS` or `v22 LTS`)
- **npm** `v9.0.0` or higher (bundled with Node.js)
- **Git** (for cloning the repository)

Verify your local versions:

```bash
node -v
npm -v
```

---

## Local Setup & Installation Instructions

### 1. Clone or Extract the Project Repository

```bash
git clone <your-repository-url> foundit-campus-directory
cd foundit-campus-directory
```

### 2. Install Project Dependencies

Install all required frontend and backend packages from `package.json`:

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

Copy `.env.example` to `.env` if you wish to customize environment variables. Firebase client configuration is pre-configured in `firebase-applet-config.json`.

```bash
cp .env.example .env
```

### 4. Start the Local Development Server

Run the full-stack Express + Vite development server on port `3000`:

```bash
npm run dev
```

Once started, open your browser and navigate to:

```text
http://localhost:3000
```

---

## Available npm Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the full-stack Express + Vite development server on `http://localhost:3000` using `tsx server.ts`. |
| `npm run build` | Compiles and bundles the production React application into the `dist/` directory via Vite. |
| `npm run start` | Runs the production server (`node server.ts`). |
| `npm run lint` | Runs TypeScript static type-checking (`tsc --noEmit`) across the entire codebase. |
| `npx eslint firestore.rules` | Validates the Cloud Firestore security rules for syntax and security compliance. |

---

## Login Credentials for Testing & Evaluation

### 1. Pre-Configured Campus Security Administrator (Highest Privileges)
- **Email:** `admin@foundit.edu`
- **Password:** `Admin@FoundIt2026`
- *Tip:* Inside the **Admin Console** tab of the Sign-In modal, click **"Fill Pre-Made Admin"** to populate these credentials automatically.

### 2. Demo University Student Account (`.edu`)
- **Email:** `alex.rivera@stanford.edu`
- **Password:** `Student@2026`
- *Tip:* Inside the **Student Portal (.edu)** tab of the Sign-In modal, click **"Fill Demo .edu Student"** to populate these credentials, or register any new `.edu` / `.ac.in` university email address.

---

## Project Directory Structure

```text
foundit-campus-directory/
├── public/
│   ├── assets/aistudio/                         # Module verification screenshots
│   └── FoundIt_Web_Technology_Project_Report.doc # Downloadable MIT Manipal Project Report (.doc)
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx                      # Public landing page & interactive 64-bit dHash inspector
│   │   ├── AuthModal.tsx                        # .edu Student & Pre-Made Admin authentication modal
│   │   ├── StudentDashboard.tsx                 # Student Portal (Found Dir, Image Hash Search, Report Lost, My Claims)
│   │   └── AdminDashboard.tsx                   # Admin Console (Log Found, Claim Verification, Resolved History, DB & CSV)
│   ├── utils/
│   │   ├── imageHash.ts                         # 64-bit Perceptual Difference Hash (dHash) & Canvas generator
│   │   └── seedData.ts                          # Initial campus catalog items & sample claims
│   ├── App.tsx                                  # Root application state, Firestore listeners & responsive shell
│   ├── firebase.ts                              # Firebase SDK initialization & structured error handler
│   ├── types.ts                                 # TypeScript interfaces & validation constants
│   ├── index.css                                # Tailwind CSS v4 configuration & typography variables
│   └── main.tsx                                 # React DOM entry point
├── firestore.rules                              # Deployed Cloud Firestore Role-Based Security Rules
├── firebase-blueprint.json                      # Firestore collections & schema blueprint
├── server.ts                                    # Node.js Express server (/api/hash-compare, /api/state)
├── FoundIt_Web_Technology_Project_Report.doc    # MIT Manipal Web Technology Project Report (FLEXICORE-3131)
├── package.json                                 # Dependencies and scripts
└── README.md                                    # Project documentation and local run instructions
```

---

## Author & Academic Credits

- **Student Name:** Soukaryo Chandra
- **Registration Number:** `240953644`
- **Course:** Web Technology Project (`FLEXICORE-3131`), V Semester B.Tech
- **Institution:** School of Computer Engineering, Manipal Institute of Technology (M.I.T.), Manipal
