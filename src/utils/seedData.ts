import { CampusItem, ItemClaim, UserRole } from '../types';
import { computePerceptualHash, renderCampusItemCanvas } from './imageHash';

export async function buildInitialCampusItems(
  currentUserId: string,
  currentUserName: string,
  currentUserRole: UserRole = 'student'
): Promise<CampusItem[]> {
  const hydroImg = renderCampusItemCanvas('hydro_flask_navy', 'catalog');
  const sonyImg = renderCampusItemCanvas('sony_xm5_headphones', 'catalog');
  const keysImg = renderCampusItemCanvas('campus_id_keys', 'catalog');
  const calcImg = renderCampusItemCanvas('ti84_calculator', 'catalog');
  const macbookLostImg = renderCampusItemCanvas('macbook_pro_sleeve', 'query');
  const notebookImg = renderCampusItemCanvas('leather_notebook', 'query');

  const [
    hydroHash,
    sonyHash,
    keysHash,
    calcHash,
    macbookLostHash,
    notebookHash,
  ] = await Promise.all([
    computePerceptualHash(hydroImg),
    computePerceptualHash(sonyImg),
    computePerceptualHash(keysImg),
    computePerceptualHash(calcImg),
    computePerceptualHash(macbookLostImg),
    computePerceptualHash(notebookImg),
  ]);

  const nowIso = new Date().toISOString();

  // Ensure student lost reports are always attributed to a student (never to the Admin account)
  const studentReporterId =
    currentUserRole === 'student' && currentUserId
      ? currentUserId
      : 'student_alex_rivera';
  const studentReporterName =
    currentUserRole === 'student' &&
    currentUserName &&
    !currentUserName.toLowerCase().includes('admin')
      ? currentUserName
      : 'Alex Rivera';

  return [
    // 1. Active Found Directory Items (Logged by Admin from Anonymous Campus Drop-Off Desks)
    {
      id: 'item_hydroflask_102',
      type: 'found',
      title: '32oz Matte Navy HydroFlask Wide-Mouth',
      category: 'Bottles & Gear',
      location: 'Science Complex Front Lobby Drop Box — Turned in from Lecture Hall 102',
      dateOccurred: '2026-05-11',
      description:
        'Matte navy insulated bottle with black flex straw lid and a yellow Yosemite mountain sticker near the bottom rim.',
      imageDataUrl: hydroHash.previewDataUrl,
      imageHash: hydroHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_sony_xm5_103',
      type: 'found',
      title: 'Sony WH-1000XM5 Silver Headphones in Case',
      category: 'Electronics',
      location: 'Student Union Room 104 (Central Desk) — Turned in from Dining Commons',
      dateOccurred: '2026-05-12',
      description:
        'Platinum silver over-ear noise cancelling headphones inside soft zip case with USB-C cable tucked inside.',
      imageDataUrl: sonyHash.previewDataUrl,
      imageHash: sonyHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_keys_id_104',
      type: 'found',
      title: 'University Navy Lanyard with ID Holder & 2 Brass Keys',
      category: 'ID & Keys',
      location: 'Athletics Recreation Center Desk — Turned in from Main Quad Bike Racks',
      dateOccurred: '2026-05-12',
      description:
        'Woven navy campus lanyard attached to a clear badge holder and two brass dorm keys on a steel split ring.',
      imageDataUrl: keysHash.previewDataUrl,
      imageHash: keysHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 2. Resolved Archive Item (Excluded from active Found Directory; visible in Admin Resolved History)
    {
      id: 'item_ti84_calc_105',
      type: 'found',
      title: 'TI-84 Plus CE Graphing Calculator (Matte Black)',
      category: 'Electronics',
      location: 'North Engineering Hall Reception — Turned in from Room 214',
      dateOccurred: '2026-05-08',
      description:
        'Graphing calculator with slide cover intact. Verified by student ID and returned to owner; archived in Resolved History.',
      imageDataUrl: calcHash.previewDataUrl,
      imageHash: calcHash.hashHex,
      status: 'resolved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 3. Active Student Lost Item Reports (Ready for >70% Perceptual Hash Matching when Admin logs Found Drop-Offs)
    {
      id: 'item_macbook_201',
      type: 'lost',
      title: '14" MacBook Pro in Charcoal Felt Sleeve',
      category: 'Electronics',
      location: 'Engineering Library 3rd Floor',
      dateOccurred: '2026-05-10',
      description:
        'Left my 14-inch Space Gray MacBook Pro inside its dark charcoal wool sleeve with an orange robotics sticker near the study carrels.',
      imageDataUrl: macbookLostHash.previewDataUrl,
      imageHash: macbookLostHash.hashHex,
      status: 'approved',
      reporterId: studentReporterId,
      reporterName: studentReporterName,
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_notebook_202',
      type: 'lost',
      title: 'Cognac Leather Organic Chemistry Lab Journal',
      category: 'Books & Notes',
      location: 'Science Complex Room 110',
      dateOccurred: '2026-05-09',
      description:
        'Hardcover brown leather A5 dotted notebook containing handwritten synthesis diagrams and a black elastic closure band.',
      imageDataUrl: notebookHash.previewDataUrl,
      imageHash: notebookHash.hashHex,
      status: 'approved',
      reporterId: studentReporterId,
      reporterName: studentReporterName,
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

export function buildInitialSampleClaims(
  currentUserId: string,
  currentUserName: string,
  currentUserRole: UserRole = 'student'
): ItemClaim[] {
  const nowIso = new Date().toISOString();
  const studentClaimantId =
    currentUserRole === 'student' && currentUserId
      ? currentUserId
      : 'student_alex_rivera';
  const studentClaimantName =
    currentUserRole === 'student' &&
    currentUserName &&
    !currentUserName.toLowerCase().includes('admin')
      ? currentUserName
      : 'Alex Rivera';

  return [
    {
      id: 'claim_sample_301',
      itemId: 'item_hydroflask_102',
      itemTitle: '32oz Matte Navy HydroFlask Wide-Mouth',
      claimantId: studentClaimantId,
      claimantName: studentClaimantName,
      proofDescription:
        'Has my initials "AR" lightly scratched under the bottom silicone boot and a yellow Yosemite half-dome vinyl sticker on the side.',
      matchScore: 96,
      status: 'pending',
      adminNotes: '',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'claim_sample_302',
      itemId: 'item_ti84_calc_105',
      itemTitle: 'TI-84 Plus CE Graphing Calculator (Matte Black)',
      claimantId: studentClaimantId,
      claimantName: 'Maya Krishnan',
      proofDescription:
        'Battery cover has a small blue asset sticker #4419 inside and custom matrices saved in slot [A] and [B].',
      matchScore: 98,
      status: 'approved',
      adminNotes:
        'Verified student ID and custom matrix programs at North Engineering Reception. Returned to student.',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}
