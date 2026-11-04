import { CampusItem, ItemClaim, UserRole } from '../types';
import { computePerceptualHash, renderCampusItemCanvas } from './imageHash';

export async function buildInitialCampusItems(
  currentUserId: string,
  currentUserName: string,
  currentUserRole: UserRole = 'student'
): Promise<CampusItem[]> {
  // Generate authentic studio canvas illustrations for varied campus categories
  const hydroCatalogImg = renderCampusItemCanvas('hydroflask_bottle', 'catalog');
  const macbookCatalogImg = renderCampusItemCanvas('macbook_sleeve', 'catalog');
  const airpodsCatalogImg = renderCampusItemCanvas('airpods_case', 'catalog');
  const sonyCatalogImg = renderCampusItemCanvas('sony_headphones', 'catalog');
  const keysCatalogImg = renderCampusItemCanvas('student_keys_id', 'catalog');
  const backpackCatalogImg = renderCampusItemCanvas('campus_backpack', 'catalog');
  const iphoneCatalogImg = renderCampusItemCanvas('smartphone_iphone', 'catalog');
  const calcCatalogImg = renderCampusItemCanvas('ti84_calculator', 'catalog');
  const notebookCatalogImg = renderCampusItemCanvas('leather_notebook', 'catalog');

  // Query variations for student lost reports (slightly shifted perspective for 88%-96% perceptual hash match)
  const macbookQueryImg = renderCampusItemCanvas('macbook_sleeve', 'query');
  const hydroQueryImg = renderCampusItemCanvas('hydroflask_bottle', 'query');
  const airpodsQueryImg = renderCampusItemCanvas('airpods_case', 'query');

  const [
    hydroHash,
    macbookHash,
    airpodsHash,
    sonyHash,
    keysHash,
    backpackHash,
    iphoneHash,
    calcHash,
    notebookHash,
    macbookQueryHash,
    hydroQueryHash,
    airpodsQueryHash,
  ] = await Promise.all([
    computePerceptualHash(hydroCatalogImg),
    computePerceptualHash(macbookCatalogImg),
    computePerceptualHash(airpodsCatalogImg),
    computePerceptualHash(sonyCatalogImg),
    computePerceptualHash(keysCatalogImg),
    computePerceptualHash(backpackCatalogImg),
    computePerceptualHash(iphoneCatalogImg),
    computePerceptualHash(calcCatalogImg),
    computePerceptualHash(notebookCatalogImg),
    computePerceptualHash(macbookQueryImg),
    computePerceptualHash(hydroQueryImg),
    computePerceptualHash(airpodsQueryImg),
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
    // 1. ACTIVE FOUND DIRECTORY ITEMS (Logged by Admin from Anonymous Campus Drop-Off Desks)
    {
      id: 'item_hydroflask_102',
      type: 'found',
      title: '32oz Matte Navy HydroFlask Wide-Mouth',
      category: 'Bottles & Gear',
      location: 'Science Complex Front Lobby Drop Box — Turned in from Lecture Hall 102',
      dateOccurred: '2026-05-11',
      description:
        'Matte navy insulated stainless steel water bottle with black flex straw lid, silver climbing carabiner, and a yellow Yosemite mountain sticker near bottom.',
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
      id: 'item_macbook_found_101',
      type: 'found',
      title: '14" MacBook Pro in Charcoal Felt Sleeve',
      category: 'Electronics',
      location: 'Engineering Library Reception Desk — Turned in from 3rd Floor Carrels',
      dateOccurred: '2026-05-12',
      description:
        'Space gray 14-inch MacBook Pro inside a dark charcoal wool felt zipper sleeve with an orange campus robotics club sticker on the corner.',
      imageDataUrl: macbookHash.previewDataUrl,
      imageHash: macbookHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_airpods_103',
      type: 'found',
      title: 'AirPods Pro (2nd Gen) in White Wireless Case',
      category: 'Electronics',
      location: 'Student Union Information Desk — Turned in from 2nd Floor Dining Lounge',
      dateOccurred: '2026-05-12',
      description:
        'Glossy white Apple wireless charging case with both left and right AirPods Pro earbuds nestled inside; green status LED active.',
      imageDataUrl: airpodsHash.previewDataUrl,
      imageHash: airpodsHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_sony_xm5_104',
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
      id: 'item_keys_id_105',
      type: 'found',
      title: 'University Navy Lanyard with ID Holder & 3 Brass Keys',
      category: 'ID & Keys',
      location: 'Athletics Recreation Center Desk — Turned in from Main Quad Bike Racks',
      dateOccurred: '2026-05-12',
      description:
        'Woven navy campus lanyard attached to a clear badge holder, blue RFID dorm access fob, and three brass dorm keys on a steel split ring.',
      imageDataUrl: keysHash.previewDataUrl,
      imageHash: keysHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_backpack_106',
      type: 'found',
      title: 'Slate Gray Campus Commuter Backpack',
      category: 'Accessories',
      location: 'Gates Computer Science Building — Ground Floor Lobby Reception',
      dateOccurred: '2026-05-10',
      description:
        'Durable heather slate-gray canvas backpack with dual front zippered utility pockets, side mesh water bottle holder, and leather lash diamond square.',
      imageDataUrl: backpackHash.previewDataUrl,
      imageHash: backpackHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_iphone_107',
      type: 'found',
      title: 'iPhone 15 Pro Space Black in Midnight Silicone Case',
      category: 'Electronics',
      location: 'Main Quad Security Station — Turned in from Memorial Church Steps',
      dateOccurred: '2026-05-11',
      description:
        'Space Black iPhone 15 Pro inside a matte dark midnight silicone case with faint sticker residue on the lower back.',
      imageDataUrl: iphoneHash.previewDataUrl,
      imageHash: iphoneHash.hashHex,
      status: 'approved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 2. RESOLVED ARCHIVE ITEMS (Kept strictly in Admin Resolved History; excluded from Found Directory)
    {
      id: 'item_ti84_calc_108',
      type: 'found',
      title: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
      category: 'Electronics',
      location: 'North Engineering Hall Reception — Turned in from Room 214',
      dateOccurred: '2026-05-08',
      description:
        'Black graphing calculator with mint teal slide cover. Verified by student ID and returned to owner; archived in Resolved History.',
      imageDataUrl: calcHash.previewDataUrl,
      imageHash: calcHash.hashHex,
      status: 'resolved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_notebook_109',
      type: 'found',
      title: 'Cognac Leather Organic Chemistry Lab Journal',
      category: 'Books & Notes',
      location: 'Science Complex Room 110 Drop Box',
      dateOccurred: '2026-05-06',
      description:
        'Hardcover brown leather A5 dotted notebook with black elastic band. Returned to student after verifying synthesis notes. Archived in Resolved History.',
      imageDataUrl: notebookHash.previewDataUrl,
      imageHash: notebookHash.hashHex,
      status: 'resolved',
      reporterId: currentUserId,
      reporterName: 'Anonymous Drop-off',
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },

    // 3. ACTIVE STUDENT LOST ITEM REPORTS (Ready for >70% Perceptual Hash Matching against Found Directory)
    {
      id: 'item_macbook_201',
      type: 'lost',
      title: '14" MacBook Pro in Charcoal Felt Sleeve',
      category: 'Electronics',
      location: 'Engineering Library 3rd Floor',
      dateOccurred: '2026-05-10',
      description:
        'Left my 14-inch Space Gray MacBook Pro inside its dark charcoal wool sleeve with an orange robotics sticker near the study carrels.',
      imageDataUrl: macbookQueryHash.previewDataUrl,
      imageHash: macbookQueryHash.hashHex,
      status: 'approved',
      reporterId: studentReporterId,
      reporterName: studentReporterName,
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_hydroflask_202',
      type: 'lost',
      title: '32oz Matte Navy HydroFlask Wide-Mouth',
      category: 'Bottles & Gear',
      location: 'Science Complex Room 102',
      dateOccurred: '2026-05-11',
      description:
        'Lost my 32oz navy HydroFlask during Chem 102 lecture. Has a silver climbing carabiner and yellow mountain sticker.',
      imageDataUrl: hydroQueryHash.previewDataUrl,
      imageHash: hydroQueryHash.hashHex,
      status: 'approved',
      reporterId: studentReporterId,
      reporterName: studentReporterName,
      visibility: 'campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'item_airpods_203',
      type: 'lost',
      title: 'AirPods Pro (2nd Gen) with MagSafe Case',
      category: 'Electronics',
      location: 'Student Union 2nd Floor Dining',
      dateOccurred: '2026-05-12',
      description:
        'Left my AirPods Pro case on a dining table on the second floor of the student union between noon and 1 PM.',
      imageDataUrl: airpodsQueryHash.previewDataUrl,
      imageHash: airpodsQueryHash.hashHex,
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
      linkedLostItemId: 'item_hydroflask_202',
      linkedLostItemTitle: '32oz Matte Navy HydroFlask Wide-Mouth',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'claim_sample_302',
      itemId: 'item_ti84_calc_108',
      itemTitle: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
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
