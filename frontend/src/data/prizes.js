export const PRIZES = [
  {
    key: 'infuseur',
    backendLabels: ['infuseur a the', 'infuseur à thé'],
    name: 'Un infuseur a the',
    value: 'Cadeau de bienvenue',
    tier: 'Participation',
  },
  {
    key: 'detox',
    backendLabels: ['boite de 100g de the detox ou infusion', 'boîte de 100g de thé detox ou infusion'],
    name: 'Une boite de the detox ou infusion',
    value: 'Lot standard',
    tier: 'Standard',
  },
  {
    key: 'signature',
    backendLabels: ['boite de 100g de the signature', 'boîte de 100g de thé signature'],
    name: 'Une boite de the signature',
    value: 'Lot premium',
    tier: 'Premium',
  },
  {
    key: 'coffret39',
    backendLabels: ['coffret decouverte 39 euros', 'coffret découverte 39 euros'],
    name: 'Un coffret decouverte 39 euros',
    value: 'Valeur 39 euros',
    tier: 'Coffret',
  },
  {
    key: 'coffret69',
    backendLabels: ['coffret decouverte 69 euros', 'coffret découverte 69 euros'],
    name: 'Un coffret decouverte 69 euros',
    value: 'Valeur 69 euros',
    tier: 'Coffret premium',
  },
];

export const SEGMENT_TO_PRIZE = [0, 1, 2, 3, 0, 1, 2, 4];

export const SEGMENT_LABELS = ['Infuseur', 'Detox', 'Signature', '39 EUR', 'Infuseur', 'Detox', 'Signature', '69 EUR'];

export function getPrizeFromGainLabel(label) {
  const normalized = String(label || '').trim().toLowerCase();
  return PRIZES.find((prize) => prize.backendLabels.includes(normalized)) || {
    key: 'unknown',
    name: label || 'Lot gagne',
    value: 'Lot The Tip Top',
    tier: 'Gain',
  };
}

export function getSegmentIndexForPrize(prize) {
  const index = PRIZES.findIndex((item) => item.key === prize?.key);

  if (index < 0) {
    return 0;
  }

  const segmentIndex = SEGMENT_TO_PRIZE.findIndex((prizeIndex) => prizeIndex === index);
  return segmentIndex >= 0 ? segmentIndex : 0;
}
