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
  Orders,
  PaymentStatus,
  PAYMENT_STATUSES,
  cloneDefaultEvents,
  normalizeEvent,
} from '../data/events';

const statusStyles: Record<PaymentStatus, string> = {
  Approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30',
  Pending: 'bg-amber-500/10 text-amber-400 border border-amber-400/30',
  'Not Paid': 'bg-rose-500/10 text-rose-400 border border-rose-400/30',
};

const classAccent: Record<EventClass, string> = {
  Grazing: 'from-emerald-500/20 to-lime-500/10 border-emerald-400/30',
  'live station': 'from-indigo-500/20 to-fuchsia-500/10 border-indigo-400/40',
  'pre order': 'from-amber-500/20 to-orange-500/10 border-amber-400/40',
};

const statusSummaryStyles: Record<PaymentStatus, string> = {
  Approved: 'from-emerald-500/18 via-emerald-500/5 to-slate-900 border-emerald-400/40',
  Pending: 'from-amber-500/18 via-amber-500/5 to-slate-900 border-amber-400/40',
  'Not Paid': 'from-rose-500/18 via-rose-500/5 to-slate-900 border-rose-400/40',
};

const paymentStatuses = PAYMENT_STATUSES;
const eventClassFilters: (EventClass | 'All')[] = ['All', ...EVENT_CLASSES];

const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const now = () => new Date();

function daysUntil(dateISO: string) {
  const eventDate = new Date(dateISO);
  const difference = eventDate.getTime() - now().getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function isSoon(dateISO: string) {
  return daysUntil(dateISO) <= 7;
}

type OrderSummary = {
  category: string;
  items: { label: string; quantity: number }[];
};

function calculateOrderTotal(orders: Orders): number {
  return Object.values(orders).reduce((total, value) => total + value, 0);
}

function buildOrderSummary(orders: Orders): OrderSummary[] {
  return MENU.map((category) => summarizeCategory(category, orders)).filter(
    (entry) => entry.items.length > 0,
  );
}

function summarizeCategory(category: MenuCategory, orders: Orders): OrderSummary {
  return {
    category: category.title,
    items: category.items
      .map((item) => ({
        label: item.label,
        quantity: orders[item.id] ?? 0,
      }))
      .filter((item) => item.quantity > 0),
  };
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>(() => cloneDefaultEvents());
  const [selectedStatuses, setSelectedStatuses] = useState<PaymentStatus[]>(
    paymentStatuses,
  );
  const [selectedClass, setSelectedClass] = useState<EventClass | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'soonest' | 'booker'>('soonest');
  const [detailContact, setDetailContact] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(EVENT_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setEvents([]);
          return;
        }

        const sanitized = parsed
          .map((item) => normalizeEvent(item))
          .filter((item): item is Event => item !== null);

        if (sanitized.length > 0) {
          setEvents(sanitized);
        }
      }
    } catch {
      // ignore malformed local storage payloads and fall back to defaults
    }
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchesFilter = (event: Event) => {
      const withinStatus = selectedStatuses.includes(event.status);
      const withinClass =
        selectedClass === 'All' || event.eventClass === selectedClass;
      const withinSearch =
        !normalizedSearch ||
        [event.title, event.booker, event.location]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return withinStatus && withinClass && withinSearch;
    };

    const filtered = events.filter(matchesFilter);

    return filtered.sort((a, b) => {
      if (sortBy === 'booker') {
        return a.booker.localeCompare(b.booker);
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [events, selectedStatuses, selectedClass, searchTerm, sortBy]);

  const totals = useMemo(() => {
    return paymentStatuses.map((status) => ({
      status,
      count: events.filter((event) => event.status === status).length,
    }));
  }, [events]);

  const nextUrgentEvent = useMemo(() => {
    return filteredEvents.find(
      (event) => event.status !== 'Approved' && isSoon(event.date),
    );
  }, [filteredEvents]);

  const activeDetailEvent = useMemo(() => {
    if (!detailContact) {
      return null;
    }
    return events.find((event) => event.contactNumber === detailContact) ?? null;
  }, [detailContact, events]);

  const detailSummary = useMemo(() => {
    if (!activeDetailEvent) {
      return [] as OrderSummary[];
    }
    return buildOrderSummary(activeDetailEvent.orders);
  }, [activeDetailEvent]);

  const detailTotalOrders = useMemo(() => {
    return activeDetailEvent ? calculateOrderTotal(activeDetailEvent.orders) : 0;
  }, [activeDetailEvent]);

  useEffect(() => {
    if (detailContact && !activeDetailEvent) {
      setDetailContact(null);
    }
  }, [detailContact, activeDetailEvent]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotificationInfo(null);
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!('Notification' in window)) {
      setNotificationInfo('Push notifications are not supported in this browser.');
      return;
    }

    let timeoutId: number | undefined;

    const triggerUpcomingAlert = () => {
      const targetEvent = nextUrgentEvent ?? filteredEvents[0];
      if (!targetEvent) {
        setNotificationInfo('No upcoming events matched your filters.');
        return;
      }

      const message = `${targetEvent.title} for ${targetEvent.booker} is ${daysUntil(targetEvent.date)} day(s) away.`;
      setNotificationInfo(`Notification scheduled: ${message}`);

      timeoutId = window.setTimeout(() => {
        new Notification('Event Pulse', {
          body: message,
          icon: '/favicon.ico',
        });
      }, 1200);
    };

    const ensurePermission = async () => {
      if (Notification.permission === 'granted') {
        triggerUpcomingAlert();
        return;
      }

      if (Notification.permission === 'denied') {
        setNotificationInfo('Notifications blocked in browser settings.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        triggerUpcomingAlert();
      } else {
        setNotificationInfo('Notifications were not granted.');
      }
    };

    void ensurePermission();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [notificationsEnabled, filteredEvents, nextUrgentEvent]);

  const toggleStatus = (status: PaymentStatus) => {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        const next = current.filter((item) => item !== status);
        return next.length === 0 ? current : next;
      }
      return [...current, status];
    });
  };

  const handleViewDetails = (contactNumber: string) => {
    setDetailContact(contactNumber);
  };

  const handleClearDetails = () => {
    setDetailContact(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate overflow-hidden px-6 pb-24 pt-16 sm:px-12 lg:px-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),rgba(15,23,42,0.9))]" />
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
                Event Pulse
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Upcoming events, perfectly orchestrated.
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
                Stay ahead of every grazing, live station, and pre order service.
                Track payment status, anticipate deadlines, and delight your
                bookers with confidence.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/manage"
                className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-5 py-2 text-sm font-medium text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/25 hover:text-white"
              >
                Open event editor
              </Link>
              <button
                type="button"
                onClick={() => setNotificationsEnabled((value) => !value)}
                className={`group flex items-center gap-3 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  notificationsEnabled
                    ? 'border-indigo-300 bg-indigo-400/20 text-indigo-100 hover:bg-indigo-400/25'
                    : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                      notificationsEnabled ? 'bg-indigo-400/70' : 'bg-slate-600/40'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      notificationsEnabled ? 'bg-indigo-300' : 'bg-slate-500'
                    }`}
                  />
                </span>
                {notificationsEnabled ? 'Notifications on' : 'Enable push alerts'}
              </button>
            </div>
          </header>

          {notificationInfo && (
            <div className="mt-6 rounded-2xl border border-indigo-400/40 bg-indigo-500/15 px-5 py-4 text-sm text-indigo-100 shadow-lg shadow-indigo-900/30">
              <p>{notificationInfo}</p>
              <p className="mt-1 text-xs text-indigo-200/80">
                Notifications fire instantly when permission is granted. Browser support
                varies and may require HTTPS in production.
              </p>
            </div>
          )}

          <section className="mt-12 grid gap-6 sm:grid-cols-3">
            {totals.map(({ status, count }) => (
              <div
                key={status}
                className={`rounded-3xl border bg-gradient-to-br px-6 py-5 shadow-xl shadow-slate-900/30 transition-transform hover:-translate-y-1 ${statusSummaryStyles[status]}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                  <span className="text-3xl font-semibold text-white">{count}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {status === 'Approved'
                    ? 'Ready to deliver unforgettable experiences.'
                    : status === 'Pending'
                    ? 'Follow up to keep momentum strong.'
                    : 'Action required—payment still outstanding.'}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-14 rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {paymentStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selectedStatuses.includes(status)
                        ? `${statusStyles[status]} shadow shadow-slate-900/60`
                        : 'border-slate-700 bg-transparent text-slate-300 hover:border-slate-500'
                    }`}
                    type="button"
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Event type
                </span>
                <div className="flex flex-wrap gap-2">
                  {eventClassFilters.map((eventClassOption) => (
                    <button
                      key={eventClassOption}
                      type="button"
                      onClick={() => setSelectedClass(eventClassOption)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selectedClass === eventClassOption
                          ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-400/50'
                          : 'border border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {eventClassOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-inner shadow-black/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5 text-slate-400"
                >
                  <circle cx="11" cy="11" r="6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search booker, event, or venue"
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Sort by
                </span>
                <div className="inline-flex rounded-full border border-slate-700 bg-slate-900 p-1">
                  <button
                    type="button"
                    onClick={() => setSortBy('soonest')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      sortBy === 'soonest'
                        ? 'bg-indigo-500/25 text-indigo-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Soonest
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('booker')}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      sortBy === 'booker'
                        ? 'bg-indigo-500/25 text-indigo-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Booker
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-12 text-center text-sm text-slate-400">
                  No events match your filters—try broadening the search.
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const days = daysUntil(event.date);
                  const soon = isSoon(event.date);
                  const totalOrders = calculateOrderTotal(event.orders);
                  const isActive = detailContact === event.contactNumber;
                  return (
                    <article
                      key={event.contactNumber}
                      className={`rounded-3xl border bg-gradient-to-br px-6 py-6 shadow-xl shadow-slate-950/50 transition-all hover:-translate-y-[3px] hover:shadow-slate-900/40 ${classAccent[event.eventClass]} ${
                        isActive ? 'ring-2 ring-indigo-400/60' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-xs uppercase tracking-[0.3em] text-slate-300">
                              {event.eventClass}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[event.status]}`}
                            >
                              {event.status}
                            </span>
                            {isActive ? (
                              <span className="rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                                Viewing details
                              </span>
                            ) : null}
                          </div>
                          <h2 className="mt-2 text-2xl font-semibold text-white">
                            {event.title}
                          </h2>
                          <p className="mt-2 text-sm text-slate-200">
                            Booker: <span className="font-semibold">{event.booker}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            Contact:{' '}
                            <span className="font-mono text-slate-100">{event.contactNumber}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-300">{event.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Event date
                          </span>
                          <span className="text-lg font-semibold text-white">
                            {formatter.format(new Date(event.date))}
                          </span>
                          <div
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                              soon
                                ? 'border-amber-400/60 bg-amber-400/20 text-amber-200'
                                : 'border-slate-600 bg-slate-800/70 text-slate-200'
                            }`}
                          >
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                            {days > 0 ? `${days} day${days === 1 ? '' : 's'} out` : 'Today'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs text-slate-300 sm:text-sm">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5">
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
                              d="M19.5 6h-15m15 0a1.5 1.5 0 0 1 1.5 1.5v11.25a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V7.5A1.5 1.5 0 0 1 4.5 6m15 0v-.75A1.5 1.5 0 0 0 18 3.75h-3.879a1.5 1.5 0 0 0-1.06.44l-.939.94a1.5 1.5 0 0 1-1.06.44H6a1.5 1.5 0 0 0-1.5 1.5V6"
                            />
                          </svg>
                          Headcount&nbsp;{event.headcount}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5">
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
                          {totalOrders} menu item{totalOrders === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5">
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
                              d="m21 15-5.197 2.887A2.25 2.25 0 0 1 12.536 17H11.25A2.25 2.25 0 0 1 9 14.75V9.25A2.25 2.25 0 0 1 11.25 7h1.286c.394 0 .778-.108 1.113-.311L21 3"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5h3a2 2 0 0 1 2 2v10.75A2.25 2.25 0 0 1 5.75 20H3"
                            />
                          </svg>
                          {days <= 7 ? 'Priority follow-up required' : 'On schedule'}
                        </span>
                        <p className="flex-1 min-w-[16rem] text-sm text-slate-200">
                          {event.notes ? event.notes : 'No special notes recorded.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleViewDetails(event.contactNumber)}
                          className="inline-flex items-center gap-2 rounded-full border border-indigo-400/50 bg-indigo-500/15 px-4 py-1.5 text-xs font-semibold text-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-500/25 hover:text-white"
                        >
                          Booking details
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <aside className="space-y-6 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl shadow-black/50">
              <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-100">
                    Booking details
                  </h3>
                  {activeDetailEvent ? (
                    <button
                      type="button"
                      onClick={handleClearDetails}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 transition hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {activeDetailEvent ? (
                  <>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {activeDetailEvent.title}
                    </p>
                    <p className="mt-1 text-sm text-indigo-100/80">
                      {activeDetailEvent.booker} &middot;{' '}
                      <span className="font-mono">{activeDetailEvent.contactNumber}</span>
                    </p>
                    <dl className="mt-3 space-y-1 text-xs uppercase tracking-[0.2em] text-indigo-200/80">
                      <div className="flex items-center justify-between">
                        <dt>Status</dt>
                        <dd className="rounded-full border border-indigo-300/40 bg-indigo-300/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-50">
                          {activeDetailEvent.status}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Headcount</dt>
                        <dd className="text-sm font-semibold text-indigo-100">
                          {activeDetailEvent.headcount}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Event date</dt>
                        <dd className="text-sm font-semibold text-indigo-100">
                          {formatter.format(new Date(activeDetailEvent.date))}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-sm text-indigo-100/80">
                      Venue: {activeDetailEvent.location}
                    </p>
                    <p className="mt-2 text-sm text-indigo-100/70">
                      {activeDetailEvent.notes || 'No special notes recorded.'}
                    </p>
                    <div className="mt-4 rounded-xl border border-indigo-300/30 bg-indigo-400/10 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                          Menu plan
                        </h4>
                        <span className="text-xs font-semibold text-indigo-100">
                          {detailTotalOrders} item{detailTotalOrders === 1 ? '' : 's'} total
                        </span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {detailSummary.length > 0 ? (
                          detailSummary.map((category) => (
                            <div key={category.category} className="space-y-1">
                              <p className="text-sm font-semibold text-white">
                                {category.category}
                              </p>
                              <ul className="space-y-1 text-sm text-indigo-100/90">
                                {category.items.map((item) => (
                                  <li key={item.label} className="flex items-center justify-between">
                                    <span>{item.label}</span>
                                    <span className="font-mono text-indigo-200">{item.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-indigo-100/70">
                            No menu selections recorded yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-indigo-100/70">
                    Choose &ldquo;Booking details&rdquo; on an event to review contact, notes, and menu allocations.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Radar
                </h3>
                <p className="mt-2 text-lg font-semibold text-white">
                  {nextUrgentEvent
                    ? `${nextUrgentEvent.title} needs attention`
                    : 'All upcoming events look good'}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {nextUrgentEvent
                    ? `${nextUrgentEvent.booker} · ${formatter.format(
                        new Date(nextUrgentEvent.date),
                      )}`
                    : 'No pending or unpaid events in the next 7 days.'}
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-4">
                <h4 className="text-sm font-semibold text-indigo-100">
                  Quick actions
                </h4>
                <ul className="mt-3 space-y-3 text-sm text-indigo-100/90">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-300" />
                    Review pending agreements and schedule payment follow-ups.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-300" />
                    Share countdown updates with each booker 7 days out.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-300" />
                    Use push alerts to keep last-minute changes front-of-mind.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Filter recap
                </h4>
                <p className="mt-3 text-sm text-slate-200">
                  Showing{' '}
                  <span className="font-semibold text-white">
                    {filteredEvents.length}
                  </span>{' '}
                  event{filteredEvents.length === 1 ? '' : 's'} filtered by{' '}
                  <span className="font-semibold text-white">
                    {selectedStatuses.join(', ')}
                  </span>{' '}
                  status{selectedClass === 'All' ? '' : ` in ${selectedClass}`}
                  {searchTerm ? ` for "${searchTerm}"` : ''}.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}


