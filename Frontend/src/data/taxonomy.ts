import { MatchedWorker, WorkerProfile } from '../types';

export interface TradeDefinition {
  id: string;
  label: string;
  regex: RegExp;
  defaultTask: string;
  priceRange: [number, number, number]; // low, high, urgent_surge (e.g. 0.2 = +20%)
  skills: string[];
  icon: string;
}

export const TRADES: TradeDefinition[] = [
  {
    id: 'mason',
    label: 'Mason / Raj Mistri',
    regex: /mason|mistri|brick|plaster|cement|concrete|tile|foundation|wall|मिस्त्री|ಮೇಸ್ತ್ರಿ/i,
    defaultTask: 'Brick masonry & wall plastering',
    priceRange: [750, 1100, 0.2],
    skills: ['Brickwork', 'Wall Plastering', 'Tile Laying', 'Foundation Casting', 'Level Alignment'],
    icon: 'HardHat',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    regex: /fan|switch|spark|wir|light|bijli|electric|bulb|fuse|shock|बिजली|ವಿದ್ಯುತ್/i,
    defaultTask: 'Fan repair & switchboard check',
    priceRange: [250, 450, 0.2],
    skills: ['Wiring', 'Fan repair', 'Switchboard', 'MCB repair', 'Inverter'],
    icon: 'Zap',
  },
  {
    id: 'plumber',
    label: 'Plumber',
    regex: /tap|leak|pipe|geyser|water|drain|flush|sink|नल|ಪ್ಲಂಬರ್/i,
    defaultTask: 'Tap or pipe leak repair',
    priceRange: [200, 400, 0.25],
    skills: ['Tap leak', 'Pipe joint', 'Geyser install', 'Bathroom fittings', 'Water tank'],
    icon: 'Wrench',
  },
  {
    id: 'ac_technician',
    label: 'AC Technician',
    regex: /\bac\b|air condition|cooling|filter|gas|एसी/i,
    defaultTask: 'AC servicing & cooling check',
    priceRange: [500, 900, 0.15],
    skills: ['Filter cleanup', 'Gas refill', 'Cooling coils', 'Compressor check'],
    icon: 'Airplay',
  },
  {
    id: 'carpenter',
    label: 'Carpenter',
    regex: /door|hinge|wood|furniture|carpent|lock|table|बढ़ई|ಬಡಗಿ/i,
    defaultTask: 'Door hinge or lock repair',
    priceRange: [300, 700, 0.15],
    skills: ['Hinge alignment', 'Lock fitting', 'Table repair', 'Wardrobe fixing'],
    icon: 'Hammer',
  },
  {
    id: 'painter',
    label: 'Painter',
    regex: /paint|putty|color|पेंटर|ಬಣ್ಣ/i,
    defaultTask: 'Wall touch-up & painting',
    priceRange: [400, 900, 0.1],
    skills: ['Wall putty', 'Waterproof coat', 'Touch-up paint', 'Interior roll'],
    icon: 'Paintbrush',
  },
  {
    id: 'appliance_repair',
    label: 'Appliance Repair',
    regex: /washing machine|fridge|microwave|mixer/i,
    defaultTask: 'Home appliance inspection',
    priceRange: [350, 650, 0.2],
    skills: ['Motor replacement', 'Thermostat fix', 'Drum belt', 'Power issue'],
    icon: 'Tv',
  },
];

export const AREAS = ['Kankanady', 'Bejai', 'Hampankatta', 'Attavar', 'Kadri'];

export interface SampleUtterance {
  lang: string;
  role: 'worker' | 'customer';
  label: string;
  text: string;
}

export const SAMPLE_UTTERANCES: SampleUtterance[] = [
  // Worker
  {
    lang: 'en',
    role: 'worker',
    label: 'Ravi (English)',
    text: 'I am Ravi, master mason, 8 years experience, Kankanady area. I do brickwork, plastering, and foundation casting.',
  },
  {
    lang: 'hi',
    role: 'worker',
    label: 'रवि (हिन्दी)',
    text: 'मैं रवि हूँ, राज मिस्त्री, 8 साल का अनुभव, कंकनाडी इलाका। दीवार, प्लास्टर और टाइल का काम करता हूँ।',
  },
  {
    lang: 'kn',
    role: 'worker',
    label: 'ರವಿ (ಕನ್ನಡ)',
    text: 'ನಾನು ರವಿ, ಮೇಸ್ತ್ರಿ ಕೆಲಸ, 8 ವರ್ಷದ ಅನುಭವ, ಕಂಕನಾಡಿ ಪ್ರದೇಶ. ಇಟ್ಟಿಗೆ ಕೆಲಸ, ಪ್ಲಾಸ್ಟರಿಂಗ್ ಮಾಡುತ್ತೇನೆ.',
  },
  // Customer
  {
    lang: 'en',
    role: 'customer',
    label: 'Fan sparking (English)',
    text: 'Fan is making loud noise and the switchboard has sparks coming out. Need someone today.',
  },
  {
    lang: 'hi',
    role: 'customer',
    label: 'पंखे में स्पार्क (हिन्दी)',
    text: 'पंखे में आवाज़ आ रही है और स्विचबोर्ड में स्पार्क हो रहा है। आज ही मिस्त्री चाहिए।',
  },
  {
    lang: 'kn',
    role: 'customer',
    label: 'ಫ್ಯಾನ್ ಸಮಸ್ಯೆ (ಕನ್ನಡ)',
    text: 'ಫ್ಯಾನ್ ಜೋರಾಗಿ ಶಬ್ದ ಮಾಡುತ್ತಿದೆ ಮತ್ತು ಸ್ವಿಚ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಕಿಡಿ ಬರುತ್ತಿದೆ. ಇಂದೇ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಬೇಕು.',
  },
  {
    lang: 'en',
    role: 'customer',
    label: 'Bathroom leak (English)',
    text: 'Water tap is leaking heavily under the bathroom sink pipe.',
  },
];

export interface SampleProblemPhoto {
  id: string;
  title: string;
  trade: string;
  task: string;
  urgency: 'now' | 'today';
  preview: string;
  what_i_see: string;
}

export const SAMPLE_PHOTOS: SampleProblemPhoto[] = [
  {
    id: 'spark_switch',
    title: 'Sparking switchboard',
    trade: 'electrician',
    task: 'Switchboard burnt terminal replacement',
    urgency: 'now',
    what_i_see: 'Blackened scorch marks on switch plate with loose copper wiring.',
    preview: '⚡ Burnt switchboard with sparking points',
  },
  {
    id: 'leak_pipe',
    title: 'Leaking pipe joint',
    trade: 'plumber',
    task: 'Bathroom water pipe connector leak',
    urgency: 'now',
    what_i_see: 'Continuous drip from PVC pipe joint under the sink basin.',
    preview: '💧 Leaking pipe under bathroom sink',
  },
  {
    id: 'fan_wobbly',
    title: 'Ceiling fan capacitor issue',
    trade: 'electrician',
    task: 'Ceiling fan humming & slow speed fix',
    urgency: 'today',
    what_i_see: 'Ceiling fan running very slow with hum from regulator coil.',
    preview: '🔄 Noisy humming ceiling fan',
  },
  {
    id: 'ac_drip',
    title: 'AC unit water dripping',
    trade: 'ac_technician',
    task: 'AC indoor drainage pipe blocked',
    urgency: 'today',
    what_i_see: 'Condensate water overflowing from split AC indoor unit front vent.',
    preview: '❄️ AC indoor unit water leakage',
  },
];

export const SEEDED_WORKERS: Record<string, MatchedWorker[]> = {
  mason: [
    {
      id: 7,
      name: 'Ravi Kumar',
      trade: 'mason',
      stars: 4.8,
      jobs: 54,
      distance_km: 0.8,
      trust: 84,
      score: 0.942,
      reasons: ['Closest (0.8 km)', 'Master Raj Mistri (4.8 ★)', 'Site attendance verified'],
      free: 'Available for daily shift',
      phone: '+91 98450 12345',
      skills: ['Brickwork', 'Wall Plastering', 'Tile Laying', 'Foundation Casting', 'Level Alignment'],
      rate_note: '₹850 - ₹1,100 per day / shift',
    },
    {
      id: 8,
      name: 'Basavaraj M',
      trade: 'mason',
      stars: 4.6,
      jobs: 38,
      distance_km: 1.5,
      trust: 76,
      score: 0.785,
      reasons: ['Specialist in Plastering', 'Phone verified', 'Zero leave record'],
      free: 'Free from tomorrow',
      phone: '+91 98451 98765',
      skills: ['Exterior Plastering', 'Concrete Slab', 'Compound Wall'],
      rate_note: '₹800 - ₹1,000 per day / shift',
    },
    {
      id: 9,
      name: 'Anand Gowda',
      trade: 'mason',
      stars: 4.4,
      jobs: 21,
      distance_km: 2.8,
      trust: 69,
      score: 0.690,
      reasons: ['Mason Team Lead (3 Helpers)', 'Quick response'],
      free: 'Available today',
      phone: '+91 98452 45678',
      skills: ['Granite & Tile Laying', 'Casting', 'Scaffolding'],
      rate_note: '₹900 - ₹1,200 per day',
    },
  ],
  electrician: [
    {
      id: 7,
      name: 'Ravi Kumar',
      trade: 'electrician',
      stars: 4.8,
      jobs: 42,
      distance_km: 0.8,
      trust: 78,
      score: 0.926,
      reasons: ['Closest (0.8 km)', 'Top rated (4.8 ★)', 'Phone verified'],
      free: 'Tomorrow 9-11 AM',
      phone: '+91 98450 12345',
      skills: ['Wiring', 'Fan repair', 'AC repair', 'Switchboard'],
      rate_note: '₹250 - ₹450 per visit',
    },
    {
      id: 8,
      name: 'Suresh Nayak',
      trade: 'electrician',
      stars: 4.5,
      jobs: 27,
      distance_km: 1.4,
      trust: 70,
      score: 0.705,
      reasons: ['Top rated', 'Phone verified', 'Fair price'],
      free: 'Free from 11 AM today',
      phone: '+91 98451 98765',
      skills: ['Inverter setup', 'MCB fix', 'Wiring'],
      rate_note: '₹250 - ₹400 per visit',
    },
    {
      id: 9,
      name: 'Imran Sheikh',
      trade: 'electrician',
      stars: 4.3,
      jobs: 11,
      distance_km: 3.2,
      trust: 61,
      score: 0.612,
      reasons: ['Free right now', 'Quick response'],
      free: 'Free right now',
      phone: '+91 98452 45678',
      skills: ['Fan repair', 'Switch replacement', 'Tube lights'],
      rate_note: '₹200 - ₹350 per visit',
    },
  ],
  plumber: [
    {
      id: 11,
      name: 'Kiran Poojary',
      trade: 'plumber',
      stars: 4.9,
      jobs: 38,
      distance_km: 0.9,
      trust: 82,
      score: 0.915,
      reasons: ['Closest (0.9 km)', 'Master plumber', 'Phone verified'],
      free: 'Free right now',
      phone: '+91 98453 11223',
      skills: ['Tap leak', 'Geyser line', 'Flush tank', 'Drain blockage'],
      rate_note: '₹200 - ₹400 per visit',
    },
    {
      id: 12,
      name: 'Mahesh Shetty',
      trade: 'plumber',
      stars: 4.6,
      jobs: 29,
      distance_km: 1.8,
      trust: 74,
      score: 0.760,
      reasons: ['On-time guarantee', 'Phone verified'],
      free: 'Tomorrow 10 AM',
      phone: '+91 98454 22334',
      skills: ['Sink pipeline', 'Water tank float', 'Bathroom fixtures'],
      rate_note: '₹200 - ₹350 per visit',
    },
    {
      id: 13,
      name: 'Salim Ahmed',
      trade: 'plumber',
      stars: 4.4,
      jobs: 15,
      distance_km: 2.7,
      trust: 65,
      score: 0.655,
      reasons: ['Reasonable rates', 'Free today'],
      free: 'Free from 1 PM',
      phone: '+91 98455 33445',
      skills: ['Leak fixing', 'Tap replacement'],
      rate_note: '₹180 - ₹300 per visit',
    },
  ],
  ac_technician: [
    {
      id: 21,
      name: 'Naveen D Souza',
      trade: 'ac_technician',
      stars: 4.8,
      jobs: 34,
      distance_km: 1.2,
      trust: 80,
      score: 0.890,
      reasons: ['AC specialist', 'Clean service', 'Phone verified'],
      free: 'Free today 2 PM',
      phone: '+91 98456 44556',
      skills: ['Filter wash', 'Gas charging', 'Cooling fix', 'Inverter AC'],
      rate_note: '₹500 - ₹900 per visit',
    },
    {
      id: 22,
      name: 'Ismail Baig',
      trade: 'ac_technician',
      stars: 4.5,
      jobs: 19,
      distance_km: 2.1,
      trust: 71,
      score: 0.720,
      reasons: ['Top rated', 'Fast turnaround'],
      free: 'Tomorrow 9 AM',
      phone: '+91 98457 55667',
      skills: ['Copper piping', 'Compressor inspection'],
      rate_note: '₹450 - ₹850 per visit',
    },
  ],
  carpenter: [
    {
      id: 31,
      name: 'Ganesh Acharya',
      trade: 'carpenter',
      stars: 4.7,
      jobs: 26,
      distance_km: 1.5,
      trust: 76,
      score: 0.830,
      reasons: ['Skilled carpenter', 'Phone verified'],
      free: 'Tomorrow 9-12 AM',
      phone: '+91 98458 66778',
      skills: ['Door hinge', 'Lock installation', 'Wardrobe sliders'],
      rate_note: '₹300 - ₹700 per visit',
    },
  ],
  painter: [
    {
      id: 41,
      name: 'Dinesh Kulal',
      trade: 'painter',
      stars: 4.6,
      jobs: 22,
      distance_km: 1.7,
      trust: 73,
      score: 0.790,
      reasons: ['Neat work', 'Phone verified'],
      free: 'Free today',
      phone: '+91 98459 77889',
      skills: ['Wall touch-up', 'Waterproofing', 'Emulsion'],
      rate_note: '₹400 - ₹900 per visit',
    },
  ],
};

export function calculateMatchScore(
  skillMatch: number,
  distanceKm: number,
  trustScore: number,
  availability: number,
  responsiveness: number,
  jobsDone: number
): number {
  const proximity = Math.max(0, 1 - distanceKm / 8);
  const trustNorm = trustScore / 100;
  const newWorkerBoost = jobsDone <= 5 ? 0.05 : 0;
  const base =
    0.35 * skillMatch +
    0.2 * proximity +
    0.2 * trustNorm +
    0.15 * availability +
    0.1 * responsiveness +
    newWorkerBoost;
  return Math.min(0.99, Number(base.toFixed(3)));
}

export function calculateTrustScore(params: {
  phoneVerified: boolean;
  partnerVerified: boolean;
  stars: number;
  ratingsCount: number;
  repeatHireRate: number; // 0..1
  noShows: number;
  hasPhoto: boolean;
  hasSkills: boolean;
  hasArea: boolean;
  hasRateNote: boolean;
}): number {
  const phone = params.phoneVerified ? 15 : 0;
  const partner = params.partnerVerified ? 15 : 0;
  const rating = params.ratingsCount >= 3 ? (params.stars / 5) * 30 : 20;
  const repeat = params.repeatHireRate * 15;
  const reliability = Math.max(0, 15 - params.noShows * 5);
  const completeness =
    (params.hasPhoto ? 2.5 : 0) +
    (params.hasSkills ? 2.5 : 0) +
    (params.hasArea ? 2.5 : 0) +
    (params.hasRateNote ? 2.5 : 0);
  return Math.round(phone + partner + rating + repeat + reliability + completeness);
}

export function parseWorkerVoice(text: string): WorkerProfile {
  const clean = text.trim();
  const tradeMatch = TRADES.find(
    (t) =>
      t.regex.test(clean) ||
      clean.toLowerCase().includes(t.id.replace('_', ' ')) ||
      clean.toLowerCase().includes(t.label.toLowerCase())
  );
  // Extract name
  const nameMatch = clean.match(
    /(?:i am|i'm|my name is|naanu|mera naam|mera naam hai|naanna hesaru|ನಾನು|मेरा नाम)\s+([\p{L}]+)/iu
  );
  const fallbackName = clean.match(/^([A-Z][a-z]+)/)?.[1];
  // Extract years of experience
  const yearsMatch = clean.match(/(\d+)\s*(?:years?|yrs?|साल|varsha|ವರ್ಷ)/i);
  // Extract area
  const matchedAreas = AREAS.filter((a) => clean.toLowerCase().includes(a.toLowerCase()));
  const tradeId = tradeMatch ? tradeMatch.id : 'mason';
  const name = nameMatch ? nameMatch[1] : (fallbackName || 'Ravi');
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 8;
  const areas = matchedAreas.length ? matchedAreas : ['Kankanady', 'Bejai'];
  const skills = tradeMatch ? tradeMatch.skills.slice(0, 3) : ['Brickwork', 'Wall Plastering', 'Tile Laying'];
  const priceRange = tradeMatch ? tradeMatch.priceRange : [750, 1100, 0.2];
  const missing: string[] = [];
  if (!nameMatch && !fallbackName) missing.push('name');
  if (!tradeMatch) missing.push('trade');
  if (!yearsMatch) missing.push('years');
  if (!matchedAreas.length) missing.push('area');

  return {
    id: 7,
    name,
    trade: tradeId,
    experience_years: years,
    areas,
    skills,
    rate_note: `₹${priceRange[0]} - ₹${priceRange[1]} per day / shift`,
    phone: '+91 98450 12345',
    trust_score: 84,
    jobs_done: 54,
    stars: 4.8,
    rehire_pct: 94,
    verified: true,
    free_today: true,
    missing,
  };
}
