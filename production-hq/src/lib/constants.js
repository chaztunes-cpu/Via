// Single source of truth for project statuses and service types.
// Colours are Tailwind classes so they can be restyled in one place.

export const STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  AWAITING_FEEDBACK: 'awaiting_feedback',
  REVISIONS: 'revisions',
  READY_FOR_DELIVERY: 'ready_for_delivery',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
};

export const STATUS_META = {
  [STATUS.NOT_STARTED]: {
    label: 'Not Started',
    dot: 'bg-zinc-500',
    badge: 'text-zinc-300 bg-zinc-500/10 ring-zinc-500/20',
  },
  [STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    dot: 'bg-sky-400',
    badge: 'text-sky-300 bg-sky-400/10 ring-sky-400/20',
  },
  [STATUS.AWAITING_FEEDBACK]: {
    label: 'Awaiting Client Feedback',
    short: 'Awaiting Feedback',
    dot: 'bg-amber-400',
    badge: 'text-amber-300 bg-amber-400/10 ring-amber-400/20',
  },
  [STATUS.REVISIONS]: {
    label: 'Revisions',
    dot: 'bg-orange-400',
    badge: 'text-orange-300 bg-orange-400/10 ring-orange-400/20',
  },
  [STATUS.READY_FOR_DELIVERY]: {
    label: 'Ready for Delivery',
    dot: 'bg-emerald-400',
    badge: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20',
  },
  [STATUS.COMPLETED]: {
    label: 'Completed',
    dot: 'bg-violet-400',
    badge: 'text-violet-300 bg-violet-400/10 ring-violet-400/20',
  },
  [STATUS.ON_HOLD]: {
    label: 'On Hold',
    dot: 'bg-stone-500',
    badge: 'text-stone-400 bg-stone-500/10 ring-stone-500/20',
  },
};

// Display order, roughly following the production pipeline
// (also the column order for a future Kanban board).
export const STATUS_ORDER = [
  STATUS.NOT_STARTED,
  STATUS.IN_PROGRESS,
  STATUS.AWAITING_FEEDBACK,
  STATUS.REVISIONS,
  STATUS.READY_FOR_DELIVERY,
  STATUS.COMPLETED,
  STATUS.ON_HOLD,
];

export const SERVICE = {
  GHOST: 'ghost_production',
  ORIGINAL: 'original_production',
  FINISHING: 'track_finishing',
  REMIX: 'remix',
};

export const SERVICE_META = {
  [SERVICE.GHOST]: { label: 'Ghost Production' },
  [SERVICE.ORIGINAL]: { label: 'Original Production' },
  [SERVICE.FINISHING]: { label: 'Track Finishing' },
  [SERVICE.REMIX]: { label: 'Remix' },
};

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'oldest', label: 'Oldest update' },
  { value: 'deadline', label: 'Upcoming deadline' },
];

// Thresholds used by the "Needs Attention" rules.
export const ATTENTION = {
  DEADLINE_WITHIN_DAYS: 7,
  NEXT_ACTION_WITHIN_DAYS: 2,
  STALE_AFTER_DAYS: 10,
};
