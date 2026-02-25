import { CollegeSettings } from '../types';

export type TimelineEntry =
  | {
    type: 'period';
    start: string;
    end: string;
    label: string;
    order: number;
  }
  | {
    type: 'break';
    id: string;
    name: string;
    start: string;
    end: string;
    label: string;
  };

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const formatTimeRange = (start: string, end: string): string => `${start} - ${end}`;

const overlaps = (slotStart: number, slotEnd: number, rangeStart: number, rangeEnd: number) =>
  slotStart < rangeEnd && slotEnd > rangeStart;

/**
 * Build the list of teaching-period start times for a given settings object.
 *
 * Algorithm (break-aware):
 *  1. Start a cursor at college startTime.
 *  2. Attempt to place a period of `periodDuration` minutes.
 *  3. If the candidate window overlaps any break → jump the cursor to that
 *     break's endTime and retry (do NOT skip a full period-width).
 *  4. If no overlap → record the start time, advance cursor by periodDuration.
 *  5. Stop when cursor + duration > endTime.
 *
 * This ensures periods immediately resume after each break, giving the full
 * number of teaching periods (e.g. 6 periods across a 9:15–15:45 day with
 * two breaks).
 */
export const buildTeachingSlots = (settings: CollegeSettings): string[] => {
  const startMin = toMinutes(settings.startTime);
  const endMin = toMinutes(settings.endTime);
  const duration = settings.periodDuration;

  const breaks = settings.breaks
    .map(b => ({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) }))
    .filter(b => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const slots: string[] = [];
  let current = startMin;
  // After jumping over a break, allow one more period even if it slightly
  // exceeds the nominal end time — breaks should never swallow periods.
  let justJumpedBreak = false;

  while (current + duration <= endMin || (justJumpedBreak && current < endMin)) {
    justJumpedBreak = false;
    const slotEnd = current + duration;

    // Find the FIRST break that this candidate window overlaps
    const blocking = breaks.find(b => overlaps(current, slotEnd, b.start, b.end));

    if (!blocking) {
      // Clean period — record it and advance normally
      slots.push(fromMinutes(current));
      current += duration;
    } else {
      // Skip over the break: jump to its end, then retry without losing a period
      current = blocking.end;
      justJumpedBreak = true;
    }
  }

  return slots;
};

/**
 * Build the full day timeline: teaching periods interleaved with break blocks,
 * sorted chronologically. Used by ScheduleView to render the column headers.
 */
export const buildTimeline = (settings: CollegeSettings): TimelineEntry[] => {
  const duration = settings.periodDuration;
  const periodStarts = buildTeachingSlots(settings);
  let periodOrder = 1;

  const periodEntries: TimelineEntry[] = periodStarts.map(start => ({
    type: 'period',
    start,
    end: fromMinutes(toMinutes(start) + duration),
    label: `P${periodOrder++}`,
    order: periodOrder - 1,
  }));

  const breakEntries: TimelineEntry[] = settings.breaks
    .filter(b => toMinutes(b.endTime) > toMinutes(b.startTime))
    .map(b => ({
      type: 'break' as const,
      id: b.id,
      name: b.name || 'Break',
      start: b.startTime,
      end: b.endTime,
      label: b.name || 'Break',
    }));

  return [...periodEntries, ...breakEntries].sort((a, b) => {
    const byStart = toMinutes(a.start) - toMinutes(b.start);
    if (byStart !== 0) return byStart;
    // Break before period if they start at the same time
    if (a.type === b.type) return 0;
    return a.type === 'break' ? -1 : 1;
  });
};
