import { ItemCategory } from '../types';

export interface ComputedImageHash {
  hashHex: string;
  bits: number[];
  luminanceGrid: number[];
  previewDataUrl: string;
}

/**
 * Computes a 64-bit Perceptual Difference Hash (dHash) from an image source.
 *
 * Algorithm Steps:
 * 1. Downscale the image to 9x8 pixels on an HTML5 canvas (removing high-frequency noise).
 * 2. Convert each pixel to grayscale luminance: Y = 0.299*R + 0.587*G + 0.114*B.
 * 3. Compare each pixel (col 0..7) with its right neighbor (col+1): bit = left > right ? 1 : 0.
 * 4. Pack the 64 bits into a 16-character hexadecimal fingerprint.
 * 5. Also generate a compressed preview Data URL (< 90KB) safe for Firestore storage.
 */
export async function computePerceptualHash(imageSrc: string): Promise<ComputedImageHash> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // 1. 9x8 canvas for 64-bit horizontal gradient comparison (dHash)
        const hashCanvas = document.createElement('canvas');
        hashCanvas.width = 9;
        hashCanvas.height = 8;
        const hashCtx = hashCanvas.getContext('2d');
        if (!hashCtx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // Fill neutral background before drawing in case of transparent PNG
        hashCtx.fillStyle = '#F8FAFC';
        hashCtx.fillRect(0, 0, 9, 8);
        hashCtx.drawImage(img, 0, 0, 9, 8);

        const imgData = hashCtx.getImageData(0, 0, 9, 8).data;
        const gray: number[][] = [];
        const luminanceGrid: number[] = [];

        for (let y = 0; y < 8; y++) {
          const row: number[] = [];
          for (let x = 0; x < 9; x++) {
            const idx = (y * 9 + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            row.push(lum);
            if (x < 8) {
              luminanceGrid.push(lum);
            }
          }
          gray.push(row);
        }

        const bits: number[] = [];
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            bits.push(gray[y][x] >= gray[y][x + 1] ? 1 : 0);
          }
        }

        let hashHex = '';
        for (let i = 0; i < 64; i += 4) {
          const nibble =
            (bits[i] << 3) |
            (bits[i + 1] << 2) |
            (bits[i + 2] << 1) |
            bits[i + 3];
          hashHex += nibble.toString(16);
        }

        // 2. Compress preview image to max 420x315 JPEG so it stays well under Firestore 150KB limit
        const previewCanvas = document.createElement('canvas');
        const maxW = 420;
        const maxH = 315;
        let targetW = img.width || maxW;
        let targetH = img.height || maxH;
        if (targetW > maxW || targetH > maxH) {
          const ratio = Math.min(maxW / targetW, maxH / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }
        previewCanvas.width = targetW;
        previewCanvas.height = targetH;
        const previewCtx = previewCanvas.getContext('2d');
        if (previewCtx) {
          previewCtx.fillStyle = '#F8FAFC';
          previewCtx.fillRect(0, 0, targetW, targetH);
          previewCtx.drawImage(img, 0, 0, targetW, targetH);
        }
        const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.78);

        resolve({
          hashHex,
          bits,
          luminanceGrid,
          previewDataUrl,
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for perceptual hashing'));
    img.src = imageSrc;
  });
}

/**
 * Converts a 16-character hexadecimal hash into an array of 64 bits (0 or 1).
 */
export function hexToBitArray(hashHex: string): number[] {
  const clean = hashHex.trim().toLowerCase().replace(/[^0-9a-f]/g, '').padEnd(16, '0').slice(0, 16);
  const bits: number[] = [];
  for (let i = 0; i < 16; i++) {
    const val = parseInt(clean[i], 16) || 0;
    bits.push((val >> 3) & 1, (val >> 2) & 1, (val >> 1) & 1, val & 1);
  }
  return bits;
}

/**
 * Compares two 64-bit hexadecimal perceptual hashes using bitwise Hamming distance.
 */
export function comparePerceptualHashes(hashA: string, hashB: string) {
  const bitsA = hexToBitArray(hashA);
  const bitsB = hexToBitArray(hashB);
  let differingBits = 0;
  const bitMatches: boolean[] = [];

  for (let i = 0; i < 64; i++) {
    const isSame = bitsA[i] === bitsB[i];
    bitMatches.push(isSame);
    if (!isSame) differingBits++;
  }

  const matchingBits = 64 - differingBits;
  const matchPercentage = Number(((matchingBits / 64) * 100).toFixed(1));

  return {
    hammingDistance: differingBits,
    matchingBits,
    totalBits: 64,
    matchPercentage,
    bitMatches,
  };
}

export interface PresetCampusVisual {
  key: string;
  label: string;
  category: ItemCategory;
  defaultTitle: string;
  defaultLocation: string;
  defaultDescription: string;
}

export const PRESET_CAMPUS_VISUALS: PresetCampusVisual[] = [
  {
    key: 'macbook_sleeve',
    label: '14" MacBook Pro & Sleeve',
    category: 'Electronics',
    defaultTitle: '14" MacBook Pro in Charcoal Felt Sleeve',
    defaultLocation: 'Engineering Library Reception Desk — 3rd Floor',
    defaultDescription: 'Space gray 14" MacBook Pro inside a dark charcoal wool felt zipper sleeve with an orange robotics club sticker on the corner.',
  },
  {
    key: 'hydroflask_bottle',
    label: 'Navy Insulated Water Bottle',
    category: 'Bottles & Gear',
    defaultTitle: '32oz Matte Navy HydroFlask Wide-Mouth',
    defaultLocation: 'Science Complex Front Lobby Drop Box — Lecture Hall 102',
    defaultDescription: 'Matte navy stainless steel insulated bottle with black flex cap, silver climbing carabiner, and yellow mountain sticker.',
  },
  {
    key: 'airpods_case',
    label: 'AirPods Pro with MagSafe Case',
    category: 'Electronics',
    defaultTitle: 'AirPods Pro (2nd Gen) in White Wireless Case',
    defaultLocation: 'Student Union Information Desk — 2nd Floor Dining',
    defaultDescription: 'Glossy white Apple wireless charging case with both earbuds inside; small hairline scratch near the rear hinge.',
  },
  {
    key: 'sony_headphones',
    label: 'Silver Wireless Headphones',
    category: 'Electronics',
    defaultTitle: 'Sony WH-1000XM5 Silver Headphones in Case',
    defaultLocation: 'Student Union Room 104 (Central Desk) — Dining Commons',
    defaultDescription: 'Platinum silver noise-canceling over-ear headphones inside original soft-shell zipper case with USB-C charging cable.',
  },
  {
    key: 'student_keys_id',
    label: 'Navy Lanyard, ID & Keys',
    category: 'ID & Keys',
    defaultTitle: 'University Navy Lanyard with ID & 3 Brass Keys',
    defaultLocation: 'Athletics Recreation Center Desk — Main Quad Bike Racks',
    defaultDescription: 'Woven navy university lanyard holding a clear badge sleeve, blue dorm RFID key fob, and three brass keys.',
  },
  {
    key: 'campus_backpack',
    label: 'Campus Commuter Backpack',
    category: 'Accessories',
    defaultTitle: 'Slate Gray Campus Commuter Backpack',
    defaultLocation: 'Gates Computer Science Building — Ground Floor Lobby',
    defaultDescription: 'Durable heather slate-gray canvas backpack with dual front zippered pockets, side mesh water bottle holder, and leather lash square.',
  },
  {
    key: 'smartphone_iphone',
    label: 'iPhone 15 Pro in Midnight Case',
    category: 'Electronics',
    defaultTitle: 'iPhone 15 Pro Space Black (Dark Silicone Case)',
    defaultLocation: 'Main Quad Security Station — Memorial Church Steps',
    defaultDescription: 'Space Black iPhone 15 Pro with frosted glass back inside a matte dark midnight silicone case with faint sticker residue.',
  },
  {
    key: 'ti84_calculator',
    label: 'Graphing Calculator (TI-84)',
    category: 'Electronics',
    defaultTitle: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
    defaultLocation: 'North Engineering Hall Reception — Room 214',
    defaultDescription: 'Black graphing calculator with a teal/mint slide cover and initials "M.K." etched lightly on the back plastic.',
  },
  {
    key: 'leather_notebook',
    label: 'Leather Lab Notebook & Pen',
    category: 'Books & Notes',
    defaultTitle: 'Cognac Leather Organic Chemistry Lab Journal',
    defaultLocation: 'Science Complex Room 110 — Lab Station 4',
    defaultDescription: 'A5 dotted hardcover notebook with cognac brown leather cover, black elastic ribbon band, and handwritten synthesis diagrams.',
  },
  {
    key: 'sunglasses_case',
    label: 'Tortoiseshell Sunglasses in Case',
    category: 'Accessories',
    defaultTitle: 'Tortoiseshell Polarized Sunglasses in Tan Case',
    defaultLocation: 'Campus Coffee Roasters — Patio Table #6',
    defaultDescription: 'Classic acetate tortoiseshell sunglasses with dark polarized lenses inside a structured tan leather snap case.',
  },
];

/**
 * Normalizes any preset key or descriptor so aliases (e.g. hydro_flask_navy, macbook_pro_sleeve)
 * reliably resolve to their canonical drawing routine instead of falling back to default.
 */
export function normalizePresetKey(presetKey: string, category?: string): string {
  const norm = (presetKey || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm.includes('macbook') || norm.includes('laptop') || norm.includes('mac')) return 'macbook_sleeve';
  if (norm.includes('hydro') || norm.includes('flask') || norm.includes('bottle') || norm.includes('water')) return 'hydroflask_bottle';
  if (norm.includes('airpod') || norm.includes('earbud') || norm.includes('buds')) return 'airpods_case';
  if (norm.includes('sony') || norm.includes('headphone') || norm.includes('headset') || norm.includes('xm5')) return 'sony_headphones';
  if (norm.includes('lanyard') || norm.includes('key') || norm.includes('badge') || norm.includes('id')) return 'student_keys_id';
  if (norm.includes('iphone') || norm.includes('phone') || norm.includes('mobile')) return 'smartphone_iphone';
  if (norm.includes('backpack') || norm.includes('bag') || norm.includes('rucksack')) return 'campus_backpack';
  if (norm.includes('calc') || norm.includes('ti84')) return 'ti84_calculator';
  if (norm.includes('sunglass') || norm.includes('glass')) return 'sunglasses_case';
  if (norm.includes('book') || norm.includes('note') || norm.includes('journal')) return 'leather_notebook';

  if (category) {
    const catNorm = category.toLowerCase();
    if (catNorm.includes('bottle')) return 'hydroflask_bottle';
    if (catNorm.includes('id') || catNorm.includes('key')) return 'student_keys_id';
    if (catNorm.includes('bag')) return 'campus_backpack';
    if (catNorm.includes('book') || catNorm.includes('note')) return 'leather_notebook';
    if (catNorm.includes('electronic')) return 'macbook_sleeve';
  }

  return 'macbook_sleeve';
}

const canvasRenderCache = new Map<string, string>();

/**
 * Renders a deterministic, studio-lit HTML5 Canvas illustration of a campus item.
 * Setting `variant = 'query'` simulates a slightly shifted lighting/crop angle (like a student's phone photo)
 * so perceptual hash matching yields realistic 89%–98% similarity against the catalog item!
 */
export function renderCampusItemCanvas(
  rawPresetKey: string,
  variant: 'catalog' | 'query' = 'catalog',
  category?: string
): string {
  const resolvedKey = normalizePresetKey(rawPresetKey, category);
  const cacheKey = `${resolvedKey}__${variant}`;
  const cached = canvasRenderCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const shiftX = variant === 'query' ? 6 : 0;
  const shiftY = variant === 'query' ? 4 : 0;

  // 1. MACBOOK PRO IN FELT SLEEVE
  if (resolvedKey === 'macbook_sleeve') {
    // Desk surface gradient
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, variant === 'query' ? '#EDE9E0' : '#F4EFE6');
    grad.addColorStop(1, '#D8D1C4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Soft drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.roundRect(50 + shiftX, 52 + shiftY, 280, 202, 18);
    ctx.fill();

    // Charcoal felt zipper sleeve
    ctx.fillStyle = '#27272A';
    ctx.beginPath();
    ctx.roundRect(46 + shiftX, 46 + shiftY, 284, 198, 14);
    ctx.fill();

    // Sleeve zipper top trim
    ctx.fillStyle = '#18181B';
    ctx.fillRect(46 + shiftX, 46 + shiftY, 284, 12);
    ctx.fillStyle = '#A1A1AA';
    ctx.fillRect(52 + shiftX, 49 + shiftY, 22, 6); // zipper pull

    // Space gray MacBook Pro body peeking out
    const macGrad = ctx.createLinearGradient(0, 30, 0, 200);
    macGrad.addColorStop(0, '#52525B');
    macGrad.addColorStop(1, '#3F3F46');
    ctx.fillStyle = macGrad;
    ctx.beginPath();
    ctx.roundRect(82 + shiftX, 30 + shiftY, 230, 168, 10);
    ctx.fill();

    // Polished aluminum edge bevel
    ctx.strokeStyle = '#71717A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Centered glowing Apple-style monochrome logo
    ctx.fillStyle = '#E4E4E7';
    ctx.beginPath();
    ctx.arc(197 + shiftX, 114 + shiftY, 15, 0, Math.PI * 2);
    ctx.fill();
    // Logo bite cutout
    ctx.fillStyle = macGrad;
    ctx.beginPath();
    ctx.arc(209 + shiftX, 114 + shiftY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Keyboard notch indent
    ctx.fillStyle = '#27272A';
    ctx.fillRect(175 + shiftX, 31 + shiftY, 44, 4);

    // Orange campus robotics club badge sticker on sleeve
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.roundRect(100 + shiftX, 154 + shiftY, 44, 28, 4);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('ROBOTICS', 103 + shiftX, 171 + shiftY);
  }

  // 2. HYDRO FLASK NAVY WATER BOTTLE
  else if (resolvedKey === 'hydroflask_bottle') {
    // Clean studio backdrop
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, variant === 'query' ? '#E2E8F0' : '#EAF0F6');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(202 + shiftX, 268 + shiftY, 68, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Matte navy cylinder body
    const bottleGrad = ctx.createLinearGradient(145, 0, 255, 0);
    bottleGrad.addColorStop(0, '#1E3A8A');
    bottleGrad.addColorStop(0.35, '#2563EB');
    bottleGrad.addColorStop(0.8, '#1D4ED8');
    bottleGrad.addColorStop(1, '#172554');
    ctx.fillStyle = bottleGrad;
    ctx.beginPath();
    ctx.roundRect(148 + shiftX, 78 + shiftY, 104, 182, 22);
    ctx.fill();

    // Stainless steel neck rim
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(162 + shiftX, 64 + shiftY, 76, 14);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.strokeRect(162 + shiftX, 64 + shiftY, 76, 14);

    // Heavy duty black flex cap
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(158 + shiftX, 36 + shiftY, 84, 29, 7);
    ctx.fill();

    // Flex handle loop
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(200 + shiftX, 36 + shiftY, 26, Math.PI, 0, false);
    ctx.stroke();

    // Silver climbing carabiner clipped to handle
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(222 + shiftX, 18 + shiftY, 24, 40, 8);
    ctx.stroke();

    // Curved specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(164 + shiftX, 90 + shiftY, 14, 150);

    // Mountain / National Park outdoor sticker on body
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(200 + shiftX, 175 + shiftY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0F766E';
    ctx.beginPath();
    ctx.moveTo(186 + shiftX, 188 + shiftY);
    ctx.lineTo(200 + shiftX, 162 + shiftY);
    ctx.lineTo(214 + shiftX, 188 + shiftY);
    ctx.closePath();
    ctx.fill();
  }

  // 3. AIRPODS PRO WITH MAGSAFE CHARGING CASE
  else if (resolvedKey === 'airpods_case') {
    // Studio gradient
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, variant === 'query' ? '#F1F5F9' : '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Elliptical contact shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.beginPath();
    ctx.ellipse(200 + shiftX, 240 + shiftY, 85, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Open lid (angled upward)
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(125 + shiftX, 48 + shiftY, 150, 48, [18, 18, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Polished chrome hinge strip inside
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(168 + shiftX, 94 + shiftY, 64, 4);

    // Earbuds sticking up from charging bays
    // Left earbud
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(148 + shiftX, 68 + shiftY, 18, 44, 9);
    ctx.fill();
    ctx.stroke();
    // Left silicone tip
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.ellipse(157 + shiftX, 64 + shiftY, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right earbud
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(234 + shiftX, 68 + shiftY, 18, 44, 9);
    ctx.fill();
    ctx.stroke();
    // Right silicone tip
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.ellipse(243 + shiftX, 64 + shiftY, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lower case body
    const caseGrad = ctx.createLinearGradient(125, 0, 275, 0);
    caseGrad.addColorStop(0, '#F8FAFC');
    caseGrad.addColorStop(0.5, '#FFFFFF');
    caseGrad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = caseGrad;
    ctx.beginPath();
    ctx.roundRect(122 + shiftX, 98 + shiftY, 156, 128, [8, 8, 38, 38]);
    ctx.fill();
    ctx.stroke();

    // Tiny glowing green LED status light
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(200 + shiftX, 156 + shiftY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.arc(200 + shiftX, 156 + shiftY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Lightning / MagSafe subtle notch at bottom
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(190 + shiftX, 222 + shiftY, 20, 3);
  }

  // 4. SONY WH-1000XM5 SILVER NOISE-CANCELING HEADPHONES
  else if (resolvedKey === 'sony_headphones') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Soft-shell carrying case backdrop
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(200 + shiftX, 160 + shiftY, 130, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headband arc
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(200 + shiftX, 145 + shiftY, 76, Math.PI, 0, false);
    ctx.stroke();

    // Padded memory cushion
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(200 + shiftX, 142 + shiftY, 68, Math.PI * 0.9, Math.PI * 0.1, false);
    ctx.stroke();

    // Left & Right Silver Ear Cups
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.ellipse(128 + shiftX, 178 + shiftY, 32, 46, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(272 + shiftX, 178 + shiftY, 32, 46, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Copper microphone accent dot
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(118 + shiftX, 168 + shiftY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. UNIVERSITY NAVY LANYARD, ID & BRASS KEYS
  else if (resolvedKey === 'student_keys_id') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Woven navy university lanyard strap
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(85 + shiftX, 20 + shiftY);
    ctx.quadraticCurveTo(185 + shiftX, 140 + shiftY, 210 + shiftX, 125 + shiftY);
    ctx.stroke();

    // Metal lobster-claw clasp
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(205 + shiftX, 116 + shiftY, 14, 18);

    // Student ID Card Holder
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(175 + shiftX, 115 + shiftY, 145, 96, 10);
    ctx.fill();
    ctx.stroke();

    // Blue header stripe on ID card
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(178 + shiftX, 118 + shiftY, 139, 24);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('CAMPUS ID CARD', 190 + shiftX, 134 + shiftY);

    // Avatar silhouette on ID card
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(190 + shiftX, 150 + shiftY, 34, 42);

    // ID Text lines
    ctx.fillStyle = '#475569';
    ctx.fillRect(232 + shiftX, 154 + shiftY, 75, 6);
    ctx.fillRect(232 + shiftX, 166 + shiftY, 60, 5);
    ctx.fillRect(232 + shiftX, 178 + shiftY, 48, 5);

    // Brass Keyring & Keys
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(130 + shiftX, 185 + shiftY, 22, 0, Math.PI * 2);
    ctx.stroke();

    // 2 Brass keys
    ctx.fillStyle = '#D97706';
    ctx.fillRect(92 + shiftX, 205 + shiftY, 56, 14);
    ctx.fillRect(102 + shiftX, 226 + shiftY, 48, 12);

    // Blue RFID dorm fob
    ctx.fillStyle = '#1D4ED8';
    ctx.beginPath();
    ctx.ellipse(146 + shiftX, 218 + shiftY, 14, 20, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. CAMPUS COMMUTER BACKPACK
  else if (resolvedKey === 'campus_backpack') {
    // Warm clean surface
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Ground shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(200 + shiftX, 272 + shiftY, 95, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top grab handle loop
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(200 + shiftX, 60 + shiftY, 26, Math.PI, 0, false);
    ctx.stroke();

    // Main backpack body (Heather slate canvas)
    const packGrad = ctx.createLinearGradient(120, 0, 280, 0);
    packGrad.addColorStop(0, '#334155');
    packGrad.addColorStop(0.5, '#475569');
    packGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = packGrad;
    ctx.beginPath();
    ctx.roundRect(120 + shiftX, 62 + shiftY, 160, 200, [32, 32, 16, 16]);
    ctx.fill();

    // Front zippered compartment pocket
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(138 + shiftX, 150 + shiftY, 124, 100, 12);
    ctx.fill();

    // Zipper pull string
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(192 + shiftX, 146 + shiftY, 16, 4);

    // Brown leather lash diamond patch ("pig snout")
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.roundRect(188 + shiftX, 95 + shiftY, 24, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(193 + shiftX, 101 + shiftY, 4, 12);
    ctx.fillRect(203 + shiftX, 101 + shiftY, 4, 12);

    // Side mesh water bottle pocket
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(110 + shiftX, 168 + shiftY, 16, 60, 4);
    ctx.fill();
  }

  // 7. IPHONE 15 PRO IN MIDNIGHT SILICONE CASE
  else if (resolvedKey === 'smartphone_iphone') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Phone drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.roundRect(144 + shiftX, 36 + shiftY, 122, 238, 26);
    ctx.fill();

    // Midnight dark silicone phone body
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.roundRect(140 + shiftX, 32 + shiftY, 120, 236, 24);
    ctx.fill();

    // Thin Titanium perimeter rim
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 2;
    ctx.stroke();

    // OLED Glass Screen
    const screenGrad = ctx.createLinearGradient(0, 40, 0, 260);
    screenGrad.addColorStop(0, '#18181B');
    screenGrad.addColorStop(1, '#090D16');
    ctx.fillStyle = screenGrad;
    ctx.beginPath();
    ctx.roundRect(146 + shiftX, 38 + shiftY, 108, 224, 18);
    ctx.fill();

    // Dynamic Island pill
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(184 + shiftX, 46 + shiftY, 32, 10, 5);
    ctx.fill();

    // Lock screen clock widget "10:42"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10:42', 200 + shiftX, 105 + shiftY);
    ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Tuesday, May 12', 200 + shiftX, 122 + shiftY);
    ctx.textAlign = 'start';

    // Battery bar at top right
    ctx.fillStyle = '#10B981';
    ctx.fillRect(232 + shiftX, 48 + shiftY, 14, 6);

    // Bottom home indicator bar
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(180 + shiftX, 252 + shiftY, 40, 3, 2);
    ctx.fill();
  }

  // 8. TI-84 PLUS CE GRAPHING CALCULATOR
  else if (resolvedKey === 'ti84_calculator') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#ECFEFF');
    grad.addColorStop(1, '#CFFAFE');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Calculator Teal/Mint Slide Cover
    ctx.fillStyle = '#0D9488';
    ctx.beginPath();
    ctx.roundRect(128 + shiftX, 28 + shiftY, 144, 244, 18);
    ctx.fill();

    // Calculator Body
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.roundRect(136 + shiftX, 36 + shiftY, 128, 228, 14);
    ctx.fill();

    // LCD Screen
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(150 + shiftX, 52 + shiftY, 100, 62);

    // Plotted Math Sine Wave Curve
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px < 100; px += 2) {
      const py = 83 + Math.sin((px / 100) * Math.PI * 4) * 18;
      if (px === 0) ctx.moveTo(150 + px + shiftX, py + shiftY);
      else ctx.lineTo(150 + px + shiftX, py + shiftY);
    }
    ctx.stroke();

    // Keypad Grid
    ctx.fillStyle = '#52525B';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        // Highlight 2nd key blue and alpha key green
        if (r === 0 && c === 0) ctx.fillStyle = '#2563EB';
        else if (r === 0 && c === 1) ctx.fillStyle = '#16A34A';
        else ctx.fillStyle = '#52525B';
        ctx.fillRect(150 + c * 26 + shiftX, 132 + r * 23 + shiftY, 20, 15);
      }
    }
  }

  // 9. TORTOISESHELL SUNGLASSES IN TAN LEATHER CASE
  else if (resolvedKey === 'sunglasses_case') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#FEF3C7');
    grad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Open tan leather eyewear case
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.roundRect(85 + shiftX, 85 + shiftY, 230, 140, 20);
    ctx.fill();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(95 + shiftX, 95 + shiftY, 210, 120, 16);
    ctx.fill();

    // Brass snap button
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(200 + shiftX, 88 + shiftY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Left and right dark polarized lenses
    ctx.fillStyle = '#1C1917';
    ctx.beginPath();
    ctx.roundRect(118 + shiftX, 130 + shiftY, 68, 50, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(214 + shiftX, 130 + shiftY, 68, 50, 12);
    ctx.fill();

    // Tortoiseshell bridge & rim
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(118 + shiftX, 130 + shiftY, 68, 50);
    ctx.strokeRect(214 + shiftX, 130 + shiftY, 68, 50);
    ctx.beginPath();
    ctx.moveTo(186 + shiftX, 146 + shiftY);
    ctx.lineTo(214 + shiftX, 146 + shiftY);
    ctx.stroke();

    // Lens reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(126 + shiftX, 136 + shiftY, 14, 38);
    ctx.fillRect(222 + shiftX, 136 + shiftY, 14, 38);
  }

  // 10. COGNAC LEATHER LAB NOTEBOOK (DEFAULT / BOOKS)
  else {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#FEF3C7');
    grad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Leather cover shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.roundRect(118 + shiftX, 39 + shiftY, 172, 232, 12);
    ctx.fill();

    // Cognac Leather cover
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.roundRect(115 + shiftX, 35 + shiftY, 170, 230, 12);
    ctx.fill();

    // Debossed perimeter border
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.strokeRect(123 + shiftX, 43 + shiftY, 154, 214);

    // Black elastic closure strap
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(252 + shiftX, 35 + shiftY, 14, 230);

    // Ivory bookplate label
    ctx.fillStyle = '#FEFCE8';
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1;
    ctx.fillRect(142 + shiftX, 75 + shiftY, 92, 46);
    ctx.strokeRect(142 + shiftX, 75 + shiftY, 92, 46);

    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('LAB JOURNAL', 152 + shiftX, 94 + shiftY);
    ctx.font = '8px monospace';
    ctx.fillText('CHEM 201 · 2026', 152 + shiftX, 108 + shiftY);

    // Red ribbon bookmark tail
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(190 + shiftX, 260 + shiftY, 8, 22);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  canvasRenderCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Checks whether an item has a legacy fallback book hash (e.g. 0xfffbdbfb... or 0xffffbdbf...)
 * while not actually being a book/notebook/journal item.
 */
export function isLegacyBookFallback(item: {
  id?: string;
  title: string;
  category: string;
  imageDataUrl?: string;
  imageHash?: string;
}): boolean {
  const titleLower = (item.title || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();
  const isBookOrJournal =
    catLower.includes('book') ||
    titleLower.includes('journal') ||
    titleLower.includes('notebook') ||
    titleLower.includes('book');

  if (isBookOrJournal) return false;
  if (!item.imageDataUrl) return true;

  const hashLower = (item.imageHash || '').toLowerCase();
  return (
    hashLower === 'fffbdbfbadbfdfff' ||
    hashLower === 'ffffbdbfbadbffff' ||
    hashLower.startsWith('fffbdbfb') ||
    hashLower.startsWith('ffffbdbf')
  );
}

/**
 * Resolves the display image data URL for any campus item.
 * Automatically recovers from legacy fallback book hashes (e.g. 0xfffbdbfb...)
 * so non-notebook items (water bottles, laptops, headphones, lanyard, etc.)
 * instantly render their distinct, vibrant studio canvas illustrations
 * even if older documents stored in Firestore had the fallback book illustration.
 */
export function getItemDisplayImage(item: {
  id?: string;
  title: string;
  category: string;
  imageDataUrl?: string;
  imageHash?: string;
  type?: string;
}): string {
  if (isLegacyBookFallback(item)) {
    return renderCampusItemCanvas(
      item.title,
      item.type === 'lost' ? 'query' : 'catalog',
      item.category
    );
  }

  return (
    item.imageDataUrl ||
    renderCampusItemCanvas(
      item.title,
      item.type === 'lost' ? 'query' : 'catalog',
      item.category
    )
  );
}


