'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  EVENT_CLASSES,
  EVENT_STORAGE_KEY,
  Event,
  EventClass,
  MENU,
  MenuCategory,
  MenuItemId,
  Orders,
  PaymentStatus,
  PAYMENT_STATUSES,
  cloneDefaultEvents,
  createEmptyOrders,
  normalizeEvent,
} from '../../data/events';

type FlashTone = 'success' | 'error' | 'info';

type FlashMessage = {
  tone: FlashTone;
  text: string;
};

type EventForm = {
  contactNumber: string;
  title: string;
  booker: string;
  status: PaymentStatus;
  eventClass: EventClass;
  date: string;
  location: string;
  headcount: string;
  notes: string;
  orders: Orders;
};

type EventFormField = Exclude<keyof EventForm, 'orders'>;

const createEmptyForm = (): EventForm => ({
  contactNumber: '',
  title: '',
  booker: '',
  status: 'Pending',
  eventClass: 'Grazing',
  date: '',
  location: '',
  headcount: '',
  notes: '',
  orders: createEmptyOrders(),
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const statusPillStyles: Record<PaymentStatus, string> = {
  Approved: 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-300',
  Pending: 'bg-amber-500/10 border border-amber-400/40 text-amber-200',
  'Not Paid': 'bg-rose-500/10 border border-rose-400/40 text-rose-200',
};

const toneStyles: Record<FlashTone, string> = {
  success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  error: 'border-rose-400/40 bg-rose-500/15 text-rose-100',
  info: 'border-indigo-400/40 bg-indigo-500/15 text-indigo-100',
};

const ORDER_QUANTITY_MAX = 9999;

function toDateInputValue(dateISO: string) {
  if (!dateISO) {
    return '';
  }

  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function generateContactNumber(existing: Event[]): string {
  const numericSuffixes = existing
    .map((event) => {
      const match = event.contactNumber.match(/(\d{4})$/);
      return match ? Number.parseInt(match[1], 10) : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));

  const nextNumber = numericSuffixes.length ? Math.max(...numericSuffixes) + 1 : 101;
  return `202-555-${String(nextNumber).padStart(4, '0')}`;
}

function eventToForm(event: Event): EventForm {
  return {
    contactNumber: event.contactNumber,
    title: event.title,
    booker: event.booker,
    status: event.status,
    eventClass: event.eventClass,
    date: toDateInputValue(event.date),
    location: event.location,
    headcount: String(event.headcount),
    notes: event.notes,
    orders: { ...event.orders },
  };
}

function calculateOrderTotal(orders: Orders): number {
  return Object.values(orders).reduce((total, value) => total + value, 0);
}

function calculateCategoryOrderTotal(category: MenuCategory, orders: Orders): number {
  return category.items.reduce((total, item) => total + (orders[item.id] ?? 0), 0);
}

export default function ManageEventsPage() {
  const [events, setEvents] = useState<Event[]>(() => cloneDefaultEvents());
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<EventForm>(() => createEmptyForm());
  const [selectedContactNumber, setSelectedContactNumber] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(EVENT_STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setEvents([]);
          } else {
            const normalized = parsed
              .map((item) => normalizeEvent(item))
              .filter((item): item is Event => item !== null);

            if (normalized.length > 0) {
              setEvents(normalized);
            }
          }
        }
      } catch {
        setFlash({
          tone: 'error',
          text: 'Saved data was unreadable, so defaults were restored.',
        });
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timeout = window.setTimeout(() => setFlash(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [events],
  );

  const statusBreakdown = useMemo(() => {
    return PAYMENT_STATUSES.map((status) => ({
      status,
      count: events.filter((event) => event.status === status).length,
    }));
  }, [events]);

  const totalHeadcount = useMemo(() => {
    return events.reduce((acc, event) => acc + event.headcount, 0);
  }, [events]);

  const isEditing = selectedContactNumber !== null;

  const handleSelectForEdit = (event: Event) => {
    setSelectedContactNumber(event.contactNumber);
    setForm(eventToForm(event));
  };

  const handleDelete = (contactNumber: string) => {
    const target = events.find((event) => event.contactNumber === contactNumber);
    if (typeof window !== 'undefined') {
      const label = target ? `${target.title} (${target.contactNumber})` : 'this event';
      const confirmation = window.confirm(
        `Remove ${label} from the dataset? This action cannot be undone.`,
      );
      if (!confirmation) {
        return;
      }
    }

    setEvents((current) =>
      current.filter((event) => event.contactNumber !== contactNumber),
    );
    if (selectedContactNumber === contactNumber) {
      setSelectedContactNumber(null);
      setForm(createEmptyForm());
    }
    setFlash({ tone: 'info', text: 'Event removed from the dataset.' });
  };

  const handleFieldChange = (field: EventFormField, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const setOrderQuantity = (itemId: MenuItemId, quantity: number) => {
    setForm((current) => {
      const normalized = Math.max(
        0,
        Math.min(ORDER_QUANTITY_MAX, Number.isFinite(quantity) ? Math.floor(quantity) : 0),
      );

      if (current.orders[itemId] === normalized) {
        return current;
      }

      return {
        ...current,
        orders: {
          ...current.orders,
          [itemId]: normalized,
        },
      };
    });
  };

  const handleOrderInput = (itemId: MenuItemId, value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setOrderQuantity(itemId, 0);
      return;
    }
    setOrderQuantity(itemId, parsed);
  };

  const adjustOrderQuantity = (itemId: MenuItemId, delta: number) => {
    setForm((current) => {
      const currentValue = current.orders[itemId] ?? 0;
      const adjusted = Math.max(
        0,
        Math.min(ORDER_QUANTITY_MAX, currentValue + delta),
      );

      if (adjusted === currentValue) {
        return current;
      }

      return {
        ...current,
        orders: {
          ...current.orders,
          [itemId]: adjusted,
        },
      };
    });
  };

  const resetOrders = () => {
    setForm((current) => ({
      ...current,
      orders: createEmptyOrders(),
    }));
  };

  const resetForm = () => {
    setSelectedContactNumber(null);
    setForm(createEmptyForm());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = form.title.trim();
    const trimmedBooker = form.booker.trim();
    const trimmedLocation = form.location.trim();

    if (!trimmedTitle || !trimmedBooker || !trimmedLocation || !form.date) {
      setFlash({
        tone: 'error',
        text: 'Title, booker, event date, and location are required.',
      });
      return;
    }

    const parsedHeadcount = Number.parseInt(form.headcount, 10);
    if (!Number.isFinite(parsedHeadcount) || parsedHeadcount <= 0) {
      setFlash({
        tone: 'error',
        text: 'Headcount must be a positive number.',
      });
      return;
    }

    const timestamp = new Date(form.date);
    if (Number.isNaN(timestamp.getTime())) {
      setFlash({
        tone: 'error',
        text: 'Please provide a valid date and time.',
      });
      return;
    }

    const normalizedContact =
      form.contactNumber.trim() || generateContactNumber(events);
    const duplicateContact = events.some(
      (existing) =>
        existing.contactNumber === normalizedContact &&
        (isEditing ? existing.contactNumber !== selectedContactNumber : true),
    );

    if (duplicateContact) {
      setFlash({
        tone: 'error',
        text: `An event with contact number ${normalizedContact} already exists.`,
      });
      return;
    }

    const payload: Event = {
      contactNumber: normalizedContact,
      title: trimmedTitle,
      booker: trimmedBooker,
      status: form.status,
      eventClass: form.eventClass,
      date: timestamp.toISOString(),
      location: trimmedLocation,
      headcount: parsedHeadcount,
      notes: form.notes.trim(),
      orders: { ...form.orders },
    };

    setEvents((current) => {
      if (!isEditing) {
        return [...current, payload];
      }
      return current.map((existing) =>
        existing.contactNumber === selectedContactNumber ? payload : existing,
      );
    });

    setFlash({
      tone: 'success',
      text: isEditing ? 'Event updated.' : 'Event added to the schedule.',
    });

    setSelectedContactNumber(null);
    setForm(createEmptyForm());
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'event-pulse-events.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFlash({ tone: 'success', text: 'Dataset exported for download.' });
  };

  const handleReset = () => {
    setEvents(cloneDefaultEvents());
    resetForm();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(EVENT_STORAGE_KEY);
    }
    setFlash({
      tone: 'info',
      text: 'Dataset reset to the curated defaults.',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate overflow-hidden px-6 pb-24 pt-16 sm:px-12 lg:px-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),rgba(15,23,42,0.9))]" />
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
                Event Pulse · Editor
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Curate and refine your upcoming events.
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                Modify payment status, adjust dates, and add fresh bookings. Changes save in
                this browser via local storage—export the JSON to update your repository
                before deploying to Netlify.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m10.5 6-6 6 6 6"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12H5.25"
                />
              </svg>
              Back to dashboard
            </Link>
          </header>

          {flash && (
            <div
              className={`mt-8 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-lg shadow-slate-900/40 ${toneStyles[flash.tone]}`}
            >
              <span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-current" />
              <p>{flash.text}</p>
            </div>
          )}

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-4">
                {statusBreakdown.map(({ status, count }) => (
                  <div
                    key={status}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4"
                  >
                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusPillStyles[status]}`}
                    >
                      {status}
                    </span>
                    <span className="text-2xl font-semibold text-white">{count}</span>
                    <p className="text-xs text-slate-400">
                      {status === 'Approved'
                        ? 'Greenlit and ready to execute.'
                        : status === 'Pending'
                        ? 'Awaiting follow-up to confirm payment.'
                        : 'Requires urgent payment resolution.'}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Totals
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {events.length} event{events.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Combined headcount: {totalHeadcount.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-400/50 bg-indigo-500/15 px-5 py-2 text-sm font-medium text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/25 hover:text-white"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-100"
                  >
                    Reset dataset
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-xs text-slate-400">
              Netlify deploys read-only builds. After editing here, export the JSON and
              replace the data inside <code className="font-mono">src/data/events.ts</code>{' '}
              so your updates ship with the site.
            </p>
          </section>

          <section className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Upcoming events</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {sortedEvents.length} item{sortedEvents.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-6 max-h-[32rem] space-y-4 overflow-y-auto pr-2">
                {sortedEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
                    No events on file yet. Add your first booking with the form on the right.
                  </div>
                ) : (
                  sortedEvents.map((event) => (
                    <article
                      key={event.contactNumber}
                      className={`rounded-2xl border px-5 py-5 transition ${
                        selectedContactNumber === event.contactNumber
                          ? 'border-indigo-400/60 bg-indigo-500/10 shadow-lg shadow-indigo-900/40'
                          : 'border-slate-800 bg-slate-900/80 shadow shadow-slate-950/20'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                            {event.contactNumber}
                          </p>
                          <h3 className="mt-1 text-xl font-semibold text-white">
                            {event.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            Booker:{' '}
                            <span className="font-semibold text-slate-100">
                              {event.booker}
                            </span>
                          </p>
                          <p className="mt-1 text-sm text-slate-400">{event.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusPillStyles[event.status]}`}
                          >
                            {event.status}
                          </span>
                          <span className="text-sm text-slate-200">
                            {event.eventClass}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {dateFormatter.format(new Date(event.date))}
                          </span>
                          <span className="text-xs text-slate-400">
                            Headcount {event.headcount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-300">
                          {event.notes ? event.notes : 'No special notes recorded.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 7.5h18M3 12h18M3 16.5h18"
                              />
                            </svg>
                            {calculateOrderTotal(event.orders)} menu item
                            {calculateOrderTotal(event.orders) === 1 ? '' : 's'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectForEdit(event)}
                            className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/20 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(event.contactNumber)}
                            className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/20 hover:text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/40">
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit event' : 'Add a new event'}
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {isEditing
                  ? 'Updating an existing booking. Save to commit changes or reset to start a new entry.'
                  : 'Use the form below to capture a fresh booking. All fields marked with * are required.'}
              </p>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Event title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                    placeholder="Summit of Visionaries"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Booker *
                    </label>
                    <input
                      type="text"
                      value={form.booker}
                      onChange={(e) => handleFieldChange('booker', e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                      placeholder="Maya Chen"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Contact number
                    </label>
                    <input
                      type="text"
                      value={form.contactNumber}
                      onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                      placeholder="202-555-0126"
                    />
                    <p className="text-2xs text-slate-500">
                      Leave blank to auto-generate the next hotline number.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Payment status *
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleFieldChange('status', e.target.value as PaymentStatus)
                      }
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Event type *
                    </label>
                    <select
                      value={form.eventClass}
                      onChange={(e) =>
                        handleFieldChange('eventClass', e.target.value as EventClass)
                      }
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                    >
                      {EVENT_CLASSES.map((eventClass) => (
                        <option key={eventClass} value={eventClass}>
                          {eventClass}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Event date &amp; time *
                    </label>
                    <input
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Expected headcount *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.headcount}
                      onChange={(e) => handleFieldChange('headcount', e.target.value)}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Venue / location *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                    placeholder="Skyline Ballroom · Chicago"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400 focus:outline-none"
                    placeholder="Key follow-ups, vendor reminders, or production notes."
                  />
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      Menu quantities
                    </p>
                    <button
                      type="button"
                      onClick={resetOrders}
                      className="rounded-full border border-slate-700 px-3 py-1 text-2xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Adjust the portions assigned to this booking. Guests only see totals when
                    their details are pulled up.
                  </p>
                  <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800">
                    {MENU.map((category) => (
                      <div key={category.id} className="space-y-3 p-4 first:rounded-t-2xl last:rounded-b-2xl">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-white">{category.title}</h3>
                          <span className="text-2xs uppercase tracking-[0.25em] text-slate-500">
                            {calculateCategoryOrderTotal(category, form.orders)} total
                          </span>
                        </div>
                        <div className="space-y-3">
                          {category.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap"
                            >
                              <span className="text-sm text-slate-200">{item.label}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => adjustOrderQuantity(item.id, -1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                                  aria-label={`Decrease ${item.label}`}
                                >
                                  &minus;
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={ORDER_QUANTITY_MAX}
                                  value={form.orders[item.id] ?? 0}
                                  onChange={(e) => handleOrderInput(item.id, e.target.value)}
                                  className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-center text-sm text-white focus:border-indigo-400 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustOrderQuantity(item.id, 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-400/60 bg-indigo-500/20 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300 hover:text-white"
                                  aria-label={`Increase ${item.label}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/20 px-6 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/30 hover:text-white"
                  >
                    {isEditing ? 'Update event' : 'Add event'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    Clear form
                  </button>
                </div>
              </form>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
