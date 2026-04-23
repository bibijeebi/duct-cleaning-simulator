import type { EquipmentItem } from '../types/game';

export const equipmentCatalog: EquipmentItem[] = [
  {
    id: 'agitation-wand',
    name: 'Agitation Wand',
    shortName: 'Wand',
    category: 'critical',
    description: 'Air-driven whip and brush rod for mechanical agitation.',
    defaultSelected: true,
    hotbarSlot: 1,
  },
  {
    id: 'negative-air-machine',
    name: 'Negative Air Machine',
    shortName: 'Neg Air',
    category: 'critical',
    description: 'HEPA negative-pressure collector for pulling debris toward trunk access.',
    defaultSelected: true,
    hotbarSlot: 2,
  },
  {
    id: 'flex-tubing',
    name: '8 in Flex Tubing x3',
    shortName: '8 in Tube',
    category: 'critical',
    description: 'Large flexible tube sections for trunk-to-machine connections.',
    defaultSelected: true,
    hotbarSlot: 3,
  },
  {
    id: 'portable-hepa-vac',
    name: 'Portable HEPA Vacuum',
    shortName: 'HEPA Vac',
    category: 'critical',
    description: 'Portable vacuum for registers, containment cleanup, and detail work.',
    defaultSelected: true,
  },
  {
    id: 'plastic-sheeting',
    name: 'Plastic Sheeting Roll',
    shortName: 'Plastic',
    category: 'critical',
    description: 'Protects floor and furnishings below registers and trunk access.',
    defaultSelected: true,
    hotbarSlot: 4,
  },
  {
    id: 'screw-gun',
    name: 'Screw Gun + Bits',
    shortName: 'Screw Gun',
    category: 'critical',
    description: 'Driver and bits for removing registers and securing patches.',
    defaultSelected: true,
    hotbarSlot: 5,
  },
  {
    id: 'hole-saw',
    name: 'Hole Saw + Drill',
    shortName: 'Hole Saw',
    category: 'critical',
    description: 'Cuts round trunk access holes for negative-air connection.',
    defaultSelected: true,
    hotbarSlot: 6,
  },
  {
    id: 'fsk-tape',
    name: 'FSK Tape',
    shortName: 'FSK Tape',
    category: 'critical',
    description: 'Foil-scrim-kraft tape for sealing patches correctly.',
    defaultSelected: true,
    hotbarSlot: 7,
  },
  {
    id: 'patch-kit',
    name: 'Sheet Metal Patch Kit',
    shortName: 'Patch',
    category: 'critical',
    description: 'Patch plates for access holes in galvanized trunk duct.',
    defaultSelected: true,
  },
  {
    id: 'mastic',
    name: 'Mastic Tube',
    shortName: 'Mastic',
    category: 'critical',
    description: 'Seals patch edges before the metal patch and FSK tape.',
    defaultSelected: true,
    hotbarSlot: 8,
  },
  {
    id: 'compressor-hose',
    name: 'Air Compressor Hose',
    shortName: 'Air Hose',
    category: 'critical',
    description: 'Feeds compressed air to the whip tool.',
    defaultSelected: true,
    hotbarSlot: 9,
  },
  {
    id: 'utility-knife',
    name: 'Utility Knife',
    shortName: 'Knife',
    category: 'helper',
    description: 'Scores paint and caulk before register removal.',
    defaultSelected: true,
  },
  {
    id: 'extraction-bit',
    name: 'Extraction Bit',
    shortName: 'Extractor',
    category: 'helper',
    description: 'Removes stripped screws without damaging the register opening.',
    defaultSelected: true,
  },
  {
    id: 'filter',
    name: '20x20x2 Filter',
    shortName: 'Filter',
    category: 'critical',
    description: 'Replacement filter for final completion.',
    defaultSelected: true,
  },
  {
    id: 'insulation-wrap',
    name: 'Foil Insulation Wrap',
    shortName: 'Wrap',
    category: 'critical',
    description: 'Re-wraps insulated trunk access after patch inspection.',
    defaultSelected: true,
  },
  {
    id: 'chimney-brush',
    name: 'Chimney Brush',
    shortName: 'Chimney',
    category: 'minor',
    description: 'Useful but not required for this commercial office scenario.',
    defaultSelected: true,
  },
  {
    id: 'shop-broom',
    name: 'Shop Broom',
    shortName: 'Broom',
    category: 'minor',
    description: 'Cleanup tool for containment areas.',
    defaultSelected: true,
  },
  {
    id: 'coil-cleaner',
    name: 'Coil Cleaner Spray',
    shortName: 'Coil Spray',
    category: 'minor',
    description: 'Optional coil-cleaning support item.',
    defaultSelected: true,
  },
  {
    id: 'pressure-washer',
    name: 'Pressure Washer',
    shortName: 'Washer',
    category: 'minor',
    description: 'Not required for indoor ductwork, but common in the van.',
    defaultSelected: true,
  },
  {
    id: 'n95-masks',
    name: 'N95 Masks',
    shortName: 'N95',
    category: 'minor',
    description: 'Respiratory protection for dusty inspection work.',
    defaultSelected: true,
  },
  {
    id: 'duct-tape',
    name: 'Duct Tape',
    shortName: 'Duct Tape',
    category: 'trap',
    description: 'Wrong for duct patch sealing. Use FSK tape instead.',
    defaultSelected: false,
  },
  {
    id: 'dryer-vent-kit',
    name: 'Residential Dryer Vent Kit',
    shortName: 'Dryer Kit',
    category: 'trap',
    description: 'Wrong tool family for this commercial split-system job.',
    defaultSelected: false,
  },
];

export const equipmentById = new Map(equipmentCatalog.map((item) => [item.id, item]));

export const criticalEquipmentIds = equipmentCatalog
  .filter((item) => item.category === 'critical')
  .map((item) => item.id);

export const trapEquipmentIds = equipmentCatalog
  .filter((item) => item.category === 'trap')
  .map((item) => item.id);

export const hotbarItems = equipmentCatalog
  .filter((item) => item.hotbarSlot !== undefined)
  .sort((a, b) => (a.hotbarSlot ?? 0) - (b.hotbarSlot ?? 0));
