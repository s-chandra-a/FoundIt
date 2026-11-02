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
    label: 'Space Gray Laptop & Felt Sleeve',
    category: 'Electronics',
    defaultTitle: '14" MacBook Pro in Charcoal Felt Sleeve',
    defaultLocation: 'Main University Library — 3rd Floor Study Hall',
    defaultDescription: 'Space gray laptop inside a dark charcoal wool felt zipper sleeve with a small robotics club sticker on the corner.',
  },
  {
    key: 'hydroflask_bottle',
    label: 'Insulated Navy Water Bottle',
    category: 'Bottles & Gear',
    defaultTitle: '32oz Matte Navy HydroFlask with Carabiner',
    defaultLocation: 'Campus Recreation & Athletics Center',
    defaultDescription: 'Matte navy stainless steel wide-mouth bottle with black flex cap, silver climbing carabiner, and minor dent near base.',
  },
  {
    key: 'sony_headphones',
    label: 'Silver Over-Ear Wireless Headphones',
    category: 'Electronics',
    defaultTitle: 'Sony WH-1000XM5 Silver Headphones in Case',
    defaultLocation: 'Student Union Commons — Dining Atrium',
    defaultDescription: 'Platinum silver noise-canceling over-ear headphones inside original soft-shell zipper case with USB-C charging cable.',
  },
  {
    key: 'student_keys_id',
    label: 'University ID Badge & Brass Keyring',
    category: 'ID & Keys',
    defaultTitle: 'Blue Lanyard with Student ID & 3 Brass Keys',
    defaultLocation: 'Engineering & Computer Science Center — Lab 204',
    defaultDescription: 'Woven navy university lanyard holding a clear badge sleeve, dorm fob, and three brass keys.',
  },
  {
    key: 'ti84_calculator',
    label: 'Graphing Calculator (TI-84 Plus CE)',
    category: 'Electronics',
    defaultTitle: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
    defaultLocation: 'Science & Biotech Pavilion — Lecture Hall B',
    defaultDescription: 'Black graphing calculator with a teal/mint slide cover and initials "M.K." etched lightly on the back plastic.',
  },
  {
    key: 'leather_notebook',
    label: 'Hardcover Lab Notebook & Fountain Pen',
    category: 'Books & Notes',
    defaultTitle: 'Cognac Leather Organic Chemistry Lab Journal',
    defaultLocation: 'Science & Biotech Pavilion — Lecture Hall B',
    defaultDescription: 'A5 dotted hardcover notebook with cognac brown cover, elastic band, and 45 pages of handwritten synthesis notes.',
  },
];

/**
 * Renders a deterministic, studio-lit HTML5 Canvas illustration of a campus item.
 * Setting `variant = 'query'` simulates a slightly shifted lighting/crop angle (like a student's phone photo)
 * so perceptual hash matching yields realistic 89%–98% similarity against the catalog item!
 */
export function renderCampusItemCanvas(
  presetKey: string,
  variant: 'catalog' | 'query' = 'catalog'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const shiftX = variant === 'query' ? 6 : 0;
  const shiftY = variant === 'query' ? 4 : 0;

  if (presetKey === 'macbook_sleeve') {
    // Desk surface background
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, variant === 'query' ? '#EDE9E0' : '#F1EDE4');
    grad.addColorStop(1, '#D6CFC2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Charcoal felt sleeve
    ctx.fillStyle = '#27272A';
    ctx.beginPath();
    ctx.roundRect(55 + shiftX, 48 + shiftY, 270, 190, 14);
    ctx.fill();

    // Space gray laptop peeking out
    ctx.fillStyle = '#71717A';
    ctx.beginPath();
    ctx.roundRect(85 + shiftX, 34 + shiftY, 225, 165, 10);
    ctx.fill();

    // Metallic sheen & emblem
    ctx.fillStyle = '#A1A1AA';
    ctx.beginPath();
    ctx.arc(197 + shiftX, 115 + shiftY, 16, 0, Math.PI * 2);
    ctx.fill();

    // Orange robotics sticker on corner
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(102 + shiftX, 158 + shiftY, 34, 22);
  } else if (presetKey === 'hydroflask_bottle') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, variant === 'query' ? '#E2E8F0' : '#E8EEF5');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Bottle shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.beginPath();
    ctx.ellipse(205 + shiftX, 265 + shiftY, 62, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Matte navy cylinder
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.roundRect(148 + shiftX, 76 + shiftY, 104, 185, 22);
    ctx.fill();

    // Stainless steel neck rim
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(162 + shiftX, 64 + shiftY, 76, 14);

    // Black flex cap + strap
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(160 + shiftX, 38 + shiftY, 80, 28, 8);
    ctx.fill();

    // White vertical highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(165 + shiftX, 88 + shiftY, 14, 155);
  } else if (presetKey === 'sony_headphones') {
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

    // Left & Right Silver Ear Cups
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.ellipse(128 + shiftX, 178 + shiftY, 32, 46, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(272 + shiftX, 178 + shiftY, 32, 46, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Copper mic accent dot
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(118 + shiftX, 168 + shiftY, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (presetKey === 'student_keys_id') {
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#F8FAFC');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Woven Navy Lanyard Strap
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(85 + shiftX, 20 + shiftY);
    ctx.quadraticCurveTo(185 + shiftX, 140 + shiftY, 210 + shiftX, 125 + shiftY);
    ctx.stroke();

    // Student ID Card Holder
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(175 + shiftX, 115 + shiftY, 145, 96, 10);
    ctx.fill();
    ctx.stroke();

    // Blue header stripe on ID card
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(178 + shiftX, 118 + shiftY, 139, 24);

    // Avatar box on ID card
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(190 + shiftX, 152 + shiftY, 36, 44);

    // Brass Keyring & Keys
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(130 + shiftX, 185 + shiftY, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#D97706';
    ctx.fillRect(92 + shiftX, 205 + shiftY, 56, 14);
    ctx.fillRect(102 + shiftX, 226 + shiftY, 48, 12);
  } else if (presetKey === 'ti84_calculator') {
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
    ctx.fillStyle = '#A7F3D0';
    ctx.fillRect(150 + shiftX, 52 + shiftY, 100, 62);

    // Keypad Grid
    ctx.fillStyle = '#52525B';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillRect(150 + c * 26 + shiftX, 132 + r * 23 + shiftY, 20, 15);
      }
    }
  } else {
    // Cognac Leather Notebook
    const grad = ctx.createLinearGradient(0, 0, 400, 300);
    grad.addColorStop(0, '#FEF3C7');
    grad.addColorStop(1, '#FDE68A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 300);

    // Leather cover
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.roundRect(115 + shiftX, 35 + shiftY, 170, 230, 12);
    ctx.fill();

    // Black elastic closure strap
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(252 + shiftX, 35 + shiftY, 14, 230);

    // Cream label patch
    ctx.fillStyle = '#FEFCE8';
    ctx.fillRect(142 + shiftX, 75 + shiftY, 92, 46);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}
