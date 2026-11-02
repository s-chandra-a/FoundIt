import { CampusItem, ItemClaim } from '../types';
import { computePerceptualHash, PRESET_CAMPUS_VISUALS, renderCampusItemCanvas } from './imageHash';

/**
 * Generates initial campus directory items with real 64-bit perceptual image hashes.
 * Found items are logged as anonymous campus drop-offs at designated collection desks.
 */
export async function buildInitialCampusItems(reporterId: string, reporterName: string): Promise<CampusItem[]> {
  const items: CampusItem[] = [];

  const seedConfigs = [
    {
      id: 'item_macbook_101',
      presetKey: 'macbook_sleeve',
      type: 'found' as const,
      title: '14" MacBook Pro in Charcoal Felt Sleeve',
      category: 'Electronics' as const,
      location: 'Main Library Circulation Desk — Ground Floor (Dropped off at Library)',
      dateOccurred: '2026-10-30',
      description:
        'Turned in anonymously to the Main Library desk from the 3rd floor study carrels. Space gray chassis inside a dark charcoal wool felt sleeve with an orange robotics sticker.',
      status: 'approved' as const,
      reporterName: 'Anonymous Drop-off',
    },
    {
      id: 'item_hydroflask_102',
      presetKey: 'hydroflask_bottle',
      type: 'found' as const,
      title: '32oz Matte Navy HydroFlask with Carabiner',
      category: 'Bottles & Gear' as const,
      location: 'Campus Recreation Front Desk — Main Lobby (Dropped off at Gym Courts)',
      dateOccurred: '2026-10-31',
      description:
        'Dropped off anonymously at the Recreation Center desk after intramural basketball. Matte navy insulated stainless steel bottle with black wide-mouth flex cap.',
      status: 'approved' as const,
      reporterName: 'Anonymous Drop-off',
    },
    {
      id: 'item_sony_xm5_103',
      presetKey: 'sony_headphones',
      type: 'found' as const,
      title: 'Sony WH-1000XM5 Silver Headphones in Case',
      category: 'Electronics' as const,
      location: 'Student Union Security Desk — Room 104 (Dropped off at Union Commons)',
      dateOccurred: '2026-10-31',
      description:
        'Turned in anonymously to the Student Union Room 104 drop-box. Platinum silver wireless headphones inside original grey carrying case.',
      status: 'approved' as const,
      reporterName: 'Anonymous Drop-off',
    },
    {
      id: 'item_keys_id_104',
      presetKey: 'student_keys_id',
      type: 'found' as const,
      title: 'University Navy Lanyard with ID & Brass Keys',
      category: 'ID & Keys' as const,
      location: 'Engineering Hall Reception Drop-Box — Room 110 (Dropped off at ECS Lab)',
      dateOccurred: '2026-11-01',
      description:
        'Dropped off at the Engineering Hall reception desk from Systems Lab 204. Navy woven lanyard with clear badge holder and two brass room keys.',
      status: 'approved' as const,
      reporterName: 'Anonymous Drop-off',
    },
    {
      id: 'item_ti84_calc_105',
      presetKey: 'ti84_calculator',
      type: 'found' as const,
      title: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
      category: 'Electronics' as const,
      location: 'Science Pavilion Security Office — East Wing (Dropped off at Lecture Hall B)',
      dateOccurred: '2026-10-28',
      description:
        'Previously claimed and returned to owner at Science Pavilion Security Office. Mint/teal slide cover with initials M.K. on back.',
      status: 'resolved' as const,
      reporterName: 'Anonymous Drop-off',
    },
    {
      id: 'item_lost_macbook_201',
      presetKey: 'macbook_sleeve',
      type: 'lost' as const,
      title: 'Lost 14" MacBook Pro in Dark Felt Sleeve',
      category: 'Electronics' as const,
      location: 'Main University Library — 3rd Floor Study Hall',
      dateOccurred: '2026-10-30',
      description:
        'Left my Space Gray 14-inch MacBook Pro in a dark grey felt sleeve with a small orange square sticker on the lower left corner.',
      status: 'approved' as const,
      reporterName,
    },
    {
      id: 'item_lost_notebook_202',
      presetKey: 'leather_notebook',
      type: 'lost' as const,
      title: 'Cognac Leather Organic Chemistry Lab Journal',
      category: 'Books & Notes' as const,
      location: 'Science & Biotech Pavilion — Lecture Hall B',
      dateOccurred: '2026-10-29',
      description:
        'Hardcover brown leather A5 notebook with black elastic strap containing 7 weeks of lab titration data.',
      status: 'approved' as const,
      reporterName,
    },
  ];

  for (const cfg of seedConfigs) {
    const variant = cfg.type === 'lost' ? 'query' : 'catalog';
    const dataUrl = renderCampusItemCanvas(cfg.presetKey, variant);
    const computed = await computePerceptualHash(dataUrl);
    items.push({
      id: cfg.id,
      type: cfg.type,
      title: cfg.title,
      category: cfg.category,
      location: cfg.location,
      dateOccurred: cfg.dateOccurred,
      description: cfg.description,
      imageDataUrl: computed.previewDataUrl,
      imageHash: computed.hashHex,
      status: cfg.status,
      reporterId,
      reporterName: cfg.reporterName,
      visibility: 'campus',
    });
  }

  return items;
}

export function buildInitialSampleClaims(claimantId: string, claimantName: string): ItemClaim[] {
  return [
    {
      id: 'claim_sample_301',
      itemId: 'item_macbook_101',
      itemTitle: '14" MacBook Pro in Charcoal Felt Sleeve',
      claimantId,
      claimantName,
      proofDescription:
        'Serial number ends in G8Q2. The orange sticker on the felt sleeve is from the 2026 Campus Robotics Symposium, and the lockscreen wallpaper shows Half Dome.',
      matchScore: 95.3,
      status: 'pending',
      adminNotes: '',
      visibility: 'campus',
    },
    {
      id: 'claim_sample_302',
      itemId: 'item_ti84_calc_105',
      itemTitle: 'TI-84 Plus CE Graphing Calculator (Mint Bezel)',
      claimantId,
      claimantName: 'Maya Krishnan',
      proofDescription:
        'Initials "M.K." lightly etched on the back plastic battery cover and AP Calculus program stored in PRGM slot 1.',
      matchScore: 98.4,
      status: 'approved',
      adminNotes: 'Verified initials M.K. and handed over at Science Pavilion Security Office.',
      visibility: 'campus',
    },
  ];
}

export { PRESET_CAMPUS_VISUALS };
