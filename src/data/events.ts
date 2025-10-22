import defaultEventSeed from './default-events.json';

export type PaymentStatus = 'Approved' | 'Pending' | 'Not Paid';
export type EventClass = 'Grazing' | 'live station' | 'pre order';

export const PAYMENT_STATUSES: PaymentStatus[] = ['Approved', 'Pending', 'Not Paid'];
export const EVENT_CLASSES: EventClass[] = ['Grazing', 'live station', 'pre order'];

export const EVENT_STORAGE_KEY = 'event-pulse-events';

export const MENU = [
  {
    id: 'appetizers',
    title: 'Appetizers',
    items: [
      { id: 'guacamole-and-chips', label: 'Guacamole & Chips' },
      { id: 'salsa-roja', label: 'Salsa Roja' },
      { id: 'pico-de-gallo', label: 'Pico de Gallo' },
      { id: 'flautas', label: 'Flautas' },
      { id: 'salsa-verde', label: 'Salsa Verde' },
      { id: 'queso', label: 'Queso' },
      { id: 'mexican-rice', label: 'Mexican Rice' },
      { id: 'elotes-corn', label: 'Elotes Corn' },
    ],
  },
  {
    id: 'salads',
    title: 'Salads',
    items: [
      { id: 'kale-salad', label: 'Kale Salad' },
      { id: 'caesar-salad', label: 'Caesar Salad' },
      { id: 'mexican-salad', label: 'Mexican Salad' },
      { id: 'potato-salad', label: 'Potato Salad' },
    ],
  },
  {
    id: 'quesadillas',
    title: 'Quesadillas',
    items: [
      { id: 'pollo-quesadilla', label: 'Pollo Quesadilla (Chicken)' },
      { id: 'carne-quesadilla', label: 'Carne Quesadilla (Beef)' },
      { id: 'sweet-potato-beans-quesadilla', label: 'Sweet Potato & Beans Quesadilla' },
      { id: 'shrimp-quesadilla', label: 'Shrimp Quesadilla' },
    ],
  },
  {
    id: 'burritos',
    title: 'Burritos',
    items: [
      { id: 'veggie-burrito', label: 'Veggie Burrito' },
      { id: 'hongo-burrito', label: 'Hongo Burrito (Mushroom)' },
      { id: 'pollo-burrito', label: 'Pollo Burrito (Chicken)' },
      { id: 'carne-burrito', label: 'Carne Burrito (Beef)' },
      { id: 'birria-burrito', label: 'Birria Burrito (Slow-Cooked Beef)' },
    ],
  },
  {
    id: 'tacos',
    title: 'Tacos',
    items: [
      { id: 'camarones-taco', label: 'Camarones (Shrimp)' },
      { id: 'birria-taco', label: 'Birria Tacos (Beef)' },
      { id: 'pollo-loco-taco', label: 'Pollo Loco (Chicken)' },
      { id: 'adobado-taco', label: 'Adobado (Marinated Chicken)' },
      { id: 'el-jefe-taco', label: 'El Jefe (Beef)' },
      { id: 'hongo-taco', label: 'Hongo (Mushroom)' },
      { id: 'la-tierra-taco', label: 'La Tierra (Sweet Potato & Cauliflower)' },
      { id: 'carne-asada-taco', label: 'Carne Asada (Grilled Beef)' },
      { id: 'carne-picante-taco', label: 'Carne Picante (Spicy Beef)' },
      { id: 'al-carbon-taco', label: 'Al Carbon (Char-Grilled Beef)' },
      { id: 'la-gringa-taco', label: 'La Gringa (Fish)' },
    ],
  },
] as const;

export type MenuCategory = (typeof MENU)[number];
export type MenuItem = MenuCategory['items'][number];
export type MenuItemId = MenuItem['id'];
export type Orders = Record<MenuItemId, number>;

type StoredEvent = {
  contactNumber?: unknown;
  id?: unknown;
  title?: unknown;
  booker?: unknown;
  status?: unknown;
  eventClass?: unknown;
  date?: unknown;
  location?: unknown;
  headcount?: unknown;
  notes?: unknown;
  orders?: unknown;
};

export type Event = {
  contactNumber: string;
  title: string;
  booker: string;
  status: PaymentStatus;
  eventClass: EventClass;
  date: string;
  location: string;
  headcount: number;
  notes: string;
  orders: Orders;
};

const LEGACY_CLASS_MAP: Record<string, EventClass> = {
  'Premier Affair': 'Grazing',
  'Signature Experience': 'live station',
  'Elevated Social': 'pre order',
};

export function createEmptyOrders(): Orders {
  return MENU.reduce<Orders>((accumulator, category) => {
    category.items.forEach((item) => {
      accumulator[item.id] = 0;
    });
    return accumulator;
  }, {} as Orders);
}

function normalizeOrders(rawOrders: unknown): Orders {
  const base = createEmptyOrders();

  if (!rawOrders || typeof rawOrders !== 'object') {
    return base;
  }

  const record = rawOrders as Record<string, unknown>;

  (Object.keys(base) as MenuItemId[]).forEach((key) => {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      base[key] = Math.max(0, Math.floor(value));
      return;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) {
        base[key] = Math.max(0, parsed);
      }
    }
  });

  return base;
}

function sanitizeContactNumber(contactNumber: unknown, fallback?: unknown): string | null {
  const candidate = contactNumber ?? fallback;

  if (candidate === undefined || candidate === null) {
    return null;
  }

  const trimmed = String(candidate).trim();
  return trimmed ? trimmed : null;
}

function sanitizeEventClass(eventClass: unknown): EventClass | null {
  if (typeof eventClass !== 'string') {
    return null;
  }

  if ((EVENT_CLASSES as readonly string[]).includes(eventClass)) {
    return eventClass as EventClass;
  }

  const mapped = LEGACY_CLASS_MAP[eventClass];
  return mapped ?? null;
}

function sanitizeStatus(status: unknown): PaymentStatus | null {
  if (typeof status !== 'string') {
    return null;
  }

  return (PAYMENT_STATUSES as readonly string[]).includes(status)
    ? (status as PaymentStatus)
    : null;
}

export function normalizeEvent(value: unknown): Event | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as StoredEvent;

  const contactNumber = sanitizeContactNumber(candidate.contactNumber, candidate.id);
  if (!contactNumber) {
    return null;
  }

  if (typeof candidate.title !== 'string' || typeof candidate.booker !== 'string') {
    return null;
  }

  const status = sanitizeStatus(candidate.status);
  if (!status) {
    return null;
  }

  const eventClass = sanitizeEventClass(candidate.eventClass);
  if (!eventClass) {
    return null;
  }

  if (typeof candidate.date !== 'string' || typeof candidate.location !== 'string') {
    return null;
  }

  const headcountValue = candidate.headcount;
  const headcount =
    typeof headcountValue === 'number'
      ? headcountValue
      : Number.parseInt(String(headcountValue ?? ''), 10);

  if (!Number.isFinite(headcount)) {
    return null;
  }

  const notes =
    typeof candidate.notes === 'string'
      ? candidate.notes
      : String(candidate.notes ?? '');

  return {
    contactNumber,
    title: candidate.title,
    booker: candidate.booker,
    status,
    eventClass,
    date: candidate.date,
    location: candidate.location,
    headcount,
    notes,
    orders: normalizeOrders(candidate.orders),
  };
}

const seededDefaults = (defaultEventSeed as StoredEvent[])
  .map((event) => normalizeEvent(event))
  .filter((event): event is Event => event !== null);

export const DEFAULT_EVENTS: Event[] = seededDefaults;

export function cloneDefaultEvents(): Event[] {
  return DEFAULT_EVENTS.map((event) => ({
    ...event,
    orders: { ...event.orders },
  }));
}
