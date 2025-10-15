export type PaymentStatus = 'Approved' | 'Pending' | 'Not Paid';
export type EventClass =
  | 'Signature Experience'
  | 'Premier Affair'
  | 'Elevated Social';

export type Event = {
  id: string;
  title: string;
  booker: string;
  status: PaymentStatus;
  eventClass: EventClass;
  date: string;
  location: string;
  headcount: number;
  notes: string;
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'Approved',
  'Pending',
  'Not Paid',
];

export const EVENT_CLASSES: EventClass[] = [
  'Signature Experience',
  'Premier Affair',
  'Elevated Social',
];

export const EVENT_STORAGE_KEY = 'event-pulse-events';

export const DEFAULT_EVENTS: Event[] = [
  {
    id: 'EVT-2401',
    title: 'Azure Skyline Gala',
    booker: 'Maya Chen',
    status: 'Approved',
    eventClass: 'Premier Affair',
    date: '2025-11-02T18:30:00Z',
    location: 'Skyline Ballroom · Chicago',
    headcount: 320,
    notes: 'VIP arrivals staggered; stage lighting rehearsal on Nov 1.',
  },
  {
    id: 'EVT-2402',
    title: 'Luminescent Arts Showcase',
    booker: "Idris O'Neal",
    status: 'Pending',
    eventClass: 'Signature Experience',
    date: '2025-11-12T16:00:00Z',
    location: 'Atrium Gallery · Atlanta',
    headcount: 185,
    notes: 'Awaiting lighting contractor confirmation.',
  },
  {
    id: 'EVT-2403',
    title: 'Summit of Visionaries',
    booker: 'Valentina Rossi',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2025-11-18T14:00:00Z',
    location: 'Forum Centre · Milan',
    headcount: 420,
    notes: 'Keynote speaker tech run scheduled for Nov 17.',
  },
  {
    id: 'EVT-2404',
    title: 'Coastal Harmony Retreat',
    booker: 'Casper Holm',
    status: 'Not Paid',
    eventClass: 'Elevated Social',
    date: '2025-11-25T19:00:00Z',
    location: 'Seabreeze Resort · Copenhagen',
    headcount: 90,
    notes: 'Final installment overdue; finance notified Nov 5.',
  },
  {
    id: 'EVT-2405',
    title: 'Opaline Winter Ball',
    booker: 'Anika Patel',
    status: 'Pending',
    eventClass: 'Premier Affair',
    date: '2025-12-05T20:00:00Z',
    location: 'Grand Meridian · Toronto',
    headcount: 360,
    notes: 'Menu tasting moved to Nov 20.',
  },
  {
    id: 'EVT-2406',
    title: 'Catalyst Leadership Forum',
    booker: 'Rowan Ellis',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2025-12-12T13:30:00Z',
    location: 'Vertex Hub · London',
    headcount: 280,
    notes: 'Live translating team confirmed.',
  },
  {
    id: 'EVT-2407',
    title: 'Saffron Soirée',
    booker: 'Laila Navarro',
    status: 'Not Paid',
    eventClass: 'Elevated Social',
    date: '2025-12-20T21:00:00Z',
    location: 'Casa Naranja · Madrid',
    headcount: 210,
    notes: 'Deposit reminder sent Nov 7.',
  },
  {
    id: 'EVT-2408',
    title: 'Aurora Wellness Weekend',
    booker: 'Theo Laurent',
    status: 'Approved',
    eventClass: 'Premier Affair',
    date: '2026-01-08T10:00:00Z',
    location: 'Nordic Springs · Oslo',
    headcount: 145,
    notes: 'Wellness kits arriving Jan 4.',
  },
  {
    id: 'EVT-2409',
    title: 'Inspire Tech Launch',
    booker: 'Serena Brooks',
    status: 'Pending',
    eventClass: 'Signature Experience',
    date: '2026-01-14T17:30:00Z',
    location: 'Pulse Pavilion · Austin',
    headcount: 500,
    notes: 'Awaiting payment confirmation for LED wall.',
  },
  {
    id: 'EVT-2410',
    title: 'Celestial Charity Dinner',
    booker: 'Jaden Clarke',
    status: 'Approved',
    eventClass: 'Premier Affair',
    date: '2026-01-22T19:30:00Z',
    location: 'Orchid Hall · New York',
    headcount: 260,
    notes: 'Auction catalog final proof due Jan 12.',
  },
  {
    id: 'EVT-2411',
    title: 'Future Minds Expo',
    booker: 'Priya Nwosu',
    status: 'Pending',
    eventClass: 'Signature Experience',
    date: '2026-01-29T09:00:00Z',
    location: 'Innovation Pier · Lagos',
    headcount: 620,
    notes: 'Sponsorship hold on Pavilion C.',
  },
  {
    id: 'EVT-2412',
    title: 'Velvet Garden Luncheon',
    booker: 'Hugo Fontaine',
    status: 'Not Paid',
    eventClass: 'Elevated Social',
    date: '2026-02-05T12:30:00Z',
    location: 'Jardin des Fleurs · Paris',
    headcount: 140,
    notes: 'Payment portal link resent Dec 12.',
  },
  {
    id: 'EVT-2413',
    title: 'Luminary Investors Forum',
    booker: 'Camila Duarte',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2026-02-11T08:30:00Z',
    location: 'Glasshouse District · São Paulo',
    headcount: 310,
    notes: 'Hybrid production crew confirmed.',
  },
  {
    id: 'EVT-2414',
    title: 'Gilded Age Anniversary',
    booker: 'Omar Rahman',
    status: 'Not Paid',
    eventClass: 'Elevated Social',
    date: '2026-02-19T18:00:00Z',
    location: 'Heritage Manor · Dubai',
    headcount: 180,
    notes: 'Client requested revised invoice on Nov 28.',
  },
  {
    id: 'EVT-2415',
    title: 'Radiant Horizons Summit',
    booker: 'Eliza Monroe',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2026-02-27T09:30:00Z',
    location: 'Helios Center · San Francisco',
    headcount: 480,
    notes: 'Breakout room schedule in review.',
  },
  {
    id: 'EVT-2416',
    title: 'Marquee Fashion Preview',
    booker: 'Finn Gallagher',
    status: 'Approved',
    eventClass: 'Premier Affair',
    date: '2026-03-06T19:00:00Z',
    location: 'Vault Studios · Dublin',
    headcount: 230,
    notes: 'Runway design locked Feb 10.',
  },
  {
    id: 'EVT-2417',
    title: 'Verdant Culinary Journey',
    booker: 'Noor Youssef',
    status: 'Pending',
    eventClass: 'Elevated Social',
    date: '2026-03-13T18:30:00Z',
    location: 'Greenhouse Collective · Cairo',
    headcount: 160,
    notes: 'Chef tasting scheduled Feb 18.',
  },
  {
    id: 'EVT-2418',
    title: 'Beacon Start-Up Showcase',
    booker: 'Sasha Petrov',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2026-03-21T11:00:00Z',
    location: 'Harbor Labs · Tallinn',
    headcount: 290,
    notes: 'Investor lounge layout finalized.',
  },
  {
    id: 'EVT-2419',
    title: 'Sapphire Estate Wedding',
    booker: 'Talia Hammond',
    status: 'Not Paid',
    eventClass: 'Premier Affair',
    date: '2026-03-28T15:00:00Z',
    location: 'Sapphire Estate · Cape Town',
    headcount: 180,
    notes: 'Payment plan agreement pending signature.',
  },
  {
    id: 'EVT-2420',
    title: 'Auric Brand Immersion',
    booker: 'Marcus Vega',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2026-04-04T10:30:00Z',
    location: 'Canvas District · Los Angeles',
    headcount: 260,
    notes: 'Immersive room build begins Mar 20.',
  },
  {
    id: 'EVT-2421',
    title: 'Moonlit Harbor Reception',
    booker: 'Sienna Harper',
    status: 'Pending',
    eventClass: 'Elevated Social',
    date: '2026-04-12T18:00:00Z',
    location: 'Harborlight Venue · Sydney',
    headcount: 150,
    notes: 'Florals pending customs clearance.',
  },
  {
    id: 'EVT-2422',
    title: 'Chroma Creative Lab',
    booker: 'Gideon Blake',
    status: 'Approved',
    eventClass: 'Signature Experience',
    date: '2026-04-19T09:00:00Z',
    location: 'Spectrum Studios · Berlin',
    headcount: 310,
    notes: 'Interactive stations pre-production locked.',
  },
  {
    id: 'EVT-2423',
    title: 'Golden Jubilee Fête',
    booker: 'Alma Ruiz',
    status: 'Pending',
    eventClass: 'Premier Affair',
    date: '2026-04-26T17:00:00Z',
    location: 'Casa Dorada · Mexico City',
    headcount: 200,
    notes: 'Awaiting patron seating chart.',
  },
  {
    id: 'EVT-2424',
    title: 'Cobalt Innovation Sprint',
    booker: 'Lucia Marino',
    status: 'Not Paid',
    eventClass: 'Signature Experience',
    date: '2026-05-02T08:30:00Z',
    location: 'Bluestone Hub · Lisbon',
    headcount: 240,
    notes: 'Finance flagged overdue balance Mar 25.',
  },
  {
    id: 'EVT-2425',
    title: 'Zenith Cultural Festival',
    booker: 'Kaito Tanaka',
    status: 'Approved',
    eventClass: 'Elevated Social',
    date: '2026-05-09T12:00:00Z',
    location: 'Riverfront Commons · Kyoto',
    headcount: 450,
    notes: 'Permits secured; pop-up vendors confirmed.',
  },
];

export function cloneDefaultEvents(): Event[] {
  return DEFAULT_EVENTS.map((event) => ({ ...event }));
}

export function normalizeEvent(value: unknown): Event | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const status = candidate.status;
  const eventClass = candidate.eventClass;
  const headcountValue = candidate.headcount;

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.booker !== 'string' ||
    typeof status !== 'string' ||
    typeof eventClass !== 'string' ||
    typeof candidate.date !== 'string' ||
    typeof candidate.location !== 'string'
  ) {
    return null;
  }

  if (!PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return null;
  }

  if (!EVENT_CLASSES.includes(eventClass as EventClass)) {
    return null;
  }

  const headcount =
    typeof headcountValue === 'number'
      ? headcountValue
      : Number.parseInt(String(headcountValue ?? ''), 10);

  if (!Number.isFinite(headcount)) {
    return null;
  }

  const notes =
    typeof candidate.notes === 'string' ? candidate.notes : String(candidate.notes ?? '');

  return {
    id: candidate.id,
    title: candidate.title,
    booker: candidate.booker,
    status: status as PaymentStatus,
    eventClass: eventClass as EventClass,
    date: candidate.date,
    location: candidate.location,
    headcount,
    notes,
  };
}
