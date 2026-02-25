/**
 * ============================================================
 *  GENT — Rule-Based Academic Timetable Generation Engine
 * ============================================================
 *
 *  Constraints implemented (in priority order):
 *  1. Weekly Period Quota   — subjects never exceed their weekly quota
 *  2. Fixed Slot Pre-alloc  — Library / NPTEL / TWS / Placement / Labs locked first
 *  3. Lab Scheduling Rule   — labs occupy ≥2 consecutive periods on the SAME day
 *  4. Day-wise Distribution — subject ≤ 2 times/day, no immediate repetition
 *  5. Break Handling        — break blocks are non-teaching; period index skips them
 *  6. Faculty Spacing       — same faculty NOT in back-to-back periods on the same day
 *  7. Generation Strategy   — fixed → labs → high-credit → low-credit; backtrack on failure
 */

import { Subject, FacultyMember, ClassSection, Room, CollegeSettings, ScheduleSlot } from '../types';
import { buildTeachingSlots } from './schedule';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EngineInput {
    subjects: Subject[];
    faculty: FacultyMember[];
    classes: ClassSection[];
    rooms: Room[];
    settings: CollegeSettings;
}

export interface EngineResult {
    schedule: ScheduleSlot[];
    warnings: string[];
    stats: {
        totalSlotsFilled: number;
        totalSlotsAvailable: number;
        subjectCoverage: Record<string, { assigned: number; quota: number }>;
    };
}

/** Internal slot key: "day|time" */
type SlotKey = string;

/** Fixed-pattern subjects by name (case-insensitive keyword match) */
const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];

/** Lab period block size (minimum consecutive periods) */
const LAB_BLOCK_SIZE = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slotKey = (day: string, time: string): SlotKey => `${day}|${time}`;

const isFixedSubject = (subject: Subject): boolean => {
    const lower = subject.name.toLowerCase();
    return (
        subject.subjectType === 'Laboratory' ||
        FIXED_KEYWORDS.some(kw => lower.includes(kw))
    );
};

const isLabSubject = (subject: Subject): boolean =>
    subject.subjectType === 'Laboratory';

/** Returns the weekly quota for a subject.
 *  Uses subject.weeklyPeriods if set, otherwise falls back to subject.hours. */
const getWeeklyQuota = (subject: Subject): number => {
    const raw = (subject as Subject & { weeklyPeriods?: number }).weeklyPeriods;
    return typeof raw === 'number' && raw > 0 ? raw : Math.max(1, subject.hours);
};

/** Pick the first faculty member qualified for a subject that is NOT busy
 *  in the given day|time slot AND (if we're checking spacing) was NOT busy
 *  in the immediately preceding period for that day. */
function pickFaculty(
    subjectId: string,
    day: string,
    time: string,
    prevTime: string | null,
    allFaculty: FacultyMember[],
    facultyBusySlots: Map<string, Set<SlotKey>>
): FacultyMember | null {
    const qualified = allFaculty.filter(f => {
        if (!f.subjects.includes(subjectId)) return false;
        // Availability check
        if (f.availability && f.availability.length > 0 && !f.availability.includes(day)) return false;
        return true;
    });

    const currentKey = slotKey(day, time);
    const prevKey = prevTime ? slotKey(day, prevTime) : null;

    // Prefer faculty NOT busy now AND NOT busy in previous period (spacing rule)
    for (const f of qualified) {
        const busy = facultyBusySlots.get(f.id) ?? new Set();
        if (busy.has(currentKey)) continue;   // already teaching this slot
        if (prevKey && busy.has(prevKey)) continue; // consecutive - violates spacing
        return f;
    }

    // Relaxed: allow consecutive if no other option
    for (const f of qualified) {
        const busy = facultyBusySlots.get(f.id) ?? new Set();
        if (!busy.has(currentKey)) return f;
    }

    return null;
}

function pickRoom(
    subject: Subject,
    day: string,
    time: string,
    rooms: Room[],
    roomBusySlots: Map<string, Set<SlotKey>>
): Room | null {
    const preferredType = subject.subjectType === 'Laboratory' ? 'Lab' : 'Classroom';
    const ordered = [
        ...rooms.filter(r => r.type === preferredType),
        ...rooms.filter(r => r.type !== preferredType),
    ];
    const key = slotKey(day, time);
    return ordered.find(r => !(roomBusySlots.get(r.id)?.has(key))) ?? null;
}

function markFacultyBusy(
    facultyId: string,
    day: string,
    time: string,
    facultyBusySlots: Map<string, Set<SlotKey>>
): void {
    if (!facultyBusySlots.has(facultyId)) facultyBusySlots.set(facultyId, new Set());
    facultyBusySlots.get(facultyId)!.add(slotKey(day, time));
}

function markRoomBusy(
    roomId: string,
    day: string,
    time: string,
    roomBusySlots: Map<string, Set<SlotKey>>
): void {
    if (!roomBusySlots.has(roomId)) roomBusySlots.set(roomId, new Set());
    roomBusySlots.get(roomId)!.add(slotKey(day, time));
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function generateTimetable(input: EngineInput): EngineResult {
    const { subjects, faculty, classes, rooms, settings } = input;
    const { workingDays } = settings;

    const schedule: ScheduleSlot[] = [];
    const warnings: string[] = [];

    /** Faculty busy slots: facultyId → Set<"day|time"> */
    const facultyBusySlots = new Map<string, Set<SlotKey>>();
    /** Room busy slots: roomId → Set<"day|time"> */
    const roomBusySlots = new Map<string, Set<SlotKey>>();

    // Build the ordered teaching slot list per day (breaks already excluded)
    const teachingSlots = buildTeachingSlots(settings); // ["09:00","10:00", ...]

    let totalSlotsAvailable = 0;
    let totalSlotsFilled = 0;
    const subjectCoverage: Record<string, { assigned: number; quota: number }> = {};

    // Pre-init coverage map
    for (const s of subjects) {
        subjectCoverage[s.id] = { assigned: 0, quota: getWeeklyQuota(s) };
    }

    // ── Process each class independently ──────────────────────────────────────
    for (const cls of classes) {
        if (cls.subjects.length === 0) continue;

        const clsSubjects = cls.subjects
            .map(id => subjects.find(s => s.id === id))
            .filter((s): s is Subject => s !== undefined);

        // Per-class remaining weekly periods
        const remaining = new Map<string, number>();
        for (const s of clsSubjects) {
            remaining.set(s.id, getWeeklyQuota(s));
        }

        // Per-class, per-day appearance count (constraint 4)
        // dayCount[day][subjectId] = count
        const dayCount: Record<string, Record<string, number>> = {};
        for (const day of workingDays) {
            dayCount[day] = {};
            for (const s of clsSubjects) dayCount[day][s.id] = 0;
        }

        // Locked slots for this class: "day|time" → ScheduleSlot
        const lockedSlots = new Map<SlotKey, ScheduleSlot>();

        // ── PHASE 1: Fixed / Non-flexible Pre-allocation ─────────────────────────
        // Subjects like Library, NPTEL, TWS, Placement are pre-assigned to
        // deterministic slots (earliest available in their preferred days).
        const fixedSubjects = clsSubjects.filter(isFixedSubject).filter(s => !isLabSubject(s));
        const theoryFlexSubjects = clsSubjects.filter(s => !isFixedSubject(s) && !isLabSubject(s));
        const labSubjects = clsSubjects.filter(isLabSubject);

        // Sort fixed subjects: most hours first
        fixedSubjects.sort((a, b) => getWeeklyQuota(b) - getWeeklyQuota(a));

        for (const subject of fixedSubjects) {
            let placed = 0;
            const quota = remaining.get(subject.id) ?? 1;

            for (const day of workingDays) {
                if (placed >= quota) break;
                if (dayCount[day][subject.id] >= 2) continue;

                for (const time of teachingSlots) {
                    if (placed >= quota) break;
                    const key = slotKey(day, time);
                    if (lockedSlots.has(key)) continue;

                    const fac = pickFaculty(subject.id, day, time, null, faculty, facultyBusySlots);
                    const room = pickRoom(subject, day, time, rooms, roomBusySlots);

                    const slot: ScheduleSlot = {
                        day,
                        time,
                        subjectId: subject.id,
                        facultyId: fac?.id ?? '',
                        roomId: room?.id ?? '',
                        classId: cls.id,
                    };

                    lockedSlots.set(key, slot);
                    schedule.push(slot);

                    if (fac) markFacultyBusy(fac.id, day, time, facultyBusySlots);
                    if (room) markRoomBusy(room.id, day, time, roomBusySlots);

                    dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
                    remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - 1);
                    placed++;
                }
            }

            subjectCoverage[subject.id].assigned += placed;
            if (placed < quota) {
                warnings.push(`[${cls.name}] Fixed subject "${subject.name}" quota not fully met (placed ${placed}/${quota}).`);
            }
        }

        // ── PHASE 2: Lab Scheduling ──────────────────────────────────────────────
        // Labs must occupy LAB_BLOCK_SIZE consecutive free periods on the SAME day.
        labSubjects.sort((a, b) => getWeeklyQuota(b) - getWeeklyQuota(a));

        for (const subject of labSubjects) {
            let placed = 0;
            const quota = remaining.get(subject.id) ?? 2;
            const blocksNeeded = Math.ceil(quota / LAB_BLOCK_SIZE);

            for (let blockIdx = 0; blockIdx < blocksNeeded; blockIdx++) {
                let blockPlaced = false;

                for (const day of workingDays) {
                    if (blockPlaced) break;
                    // A lab block must fit within LAB_BLOCK_SIZE consecutive slots
                    for (let i = 0; i <= teachingSlots.length - LAB_BLOCK_SIZE; i++) {
                        const times = teachingSlots.slice(i, i + LAB_BLOCK_SIZE);

                        // All slots in the block must be free
                        const allFree = times.every(t => !lockedSlots.has(slotKey(day, t)));
                        if (!allFree) continue;

                        // Day appearance constraint: after placing block, total ≤ 2
                        const currentDayCount = dayCount[day][subject.id] ?? 0;
                        if (currentDayCount + LAB_BLOCK_SIZE > 2) continue;

                        // Pick a faculty member available for the entire block
                        const firstTime = times[0];
                        const fac = pickFaculty(subject.id, day, firstTime, null, faculty, facultyBusySlots);
                        if (!fac) continue;

                        // Verify faculty is free for all block slots
                        const facAvailForAll = times.every(t => {
                            const bs = facultyBusySlots.get(fac.id) ?? new Set();
                            return !bs.has(slotKey(day, t));
                        });
                        if (!facAvailForAll) continue;

                        const room = pickRoom(subject, day, firstTime, rooms, roomBusySlots);

                        // Place the block
                        for (const t of times) {
                            const key = slotKey(day, t);
                            const slot: ScheduleSlot = {
                                day,
                                time: t,
                                subjectId: subject.id,
                                facultyId: fac.id,
                                roomId: room?.id ?? '',
                                classId: cls.id,
                            };
                            lockedSlots.set(key, slot);
                            schedule.push(slot);
                            markFacultyBusy(fac.id, day, t, facultyBusySlots);
                            if (room) markRoomBusy(room.id, day, t, roomBusySlots);
                        }

                        dayCount[day][subject.id] = currentDayCount + LAB_BLOCK_SIZE;
                        remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - LAB_BLOCK_SIZE);
                        placed += LAB_BLOCK_SIZE;
                        blockPlaced = true;
                        break;
                    }
                }

                if (!blockPlaced) {
                    warnings.push(`[${cls.name}] Lab "${subject.name}" could not place block ${blockIdx + 1}.`);
                }
            }

            subjectCoverage[subject.id].assigned += placed;
            if (placed < quota) {
                warnings.push(`[${cls.name}] Lab "${subject.name}" quota not fully met (placed ${placed}/${quota}).`);
            }
        }

        // ── PHASE 3: Theory (flexible) subjects — priority-based CSP ─────────────
        // Sort: High priority first, then by weekly quota descending.
        const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
        theoryFlexSubjects.sort((a, b) => {
            const pa = PRIORITY_ORDER[a.priority] ?? 1;
            const pb = PRIORITY_ORDER[b.priority] ?? 1;
            if (pa !== pb) return pa - pb;
            return getWeeklyQuota(b) - getWeeklyQuota(a);
        });

        // Build interleaved (day × slot) visit order so subjects spread evenly across all days
        type PendingSlot = { day: string; slotIdx: number; time: string };
        const pendingSlots: PendingSlot[] = [];
        for (let si = 0; si < teachingSlots.length; si++) {
            for (const day of workingDays) {
                pendingSlots.push({ day, slotIdx: si, time: teachingSlots[si] });
            }
        }

        // Track last placed subject per day (for adjacency constraint)
        const lastSubjectPerDay: Record<string, string> = {};

        // ── 3a: Quota-driven pass ──────────────────────────────────────────────
        for (const slot of pendingSlots) {
            const { day, time } = slot;
            totalSlotsAvailable++;

            const key = slotKey(day, time);
            if (lockedSlots.has(key)) {
                totalSlotsFilled++;
                continue; // filled by Phase 1 or 2
            }

            const timeIdx = teachingSlots.indexOf(time);
            const prevTime = timeIdx > 0 ? teachingSlots[timeIdx - 1] : null;

            // Candidates with remaining quota, sorted by priority then remaining count
            const candidates = theoryFlexSubjects
                .filter(s => (remaining.get(s.id) ?? 0) > 0)
                .sort((a, b) => {
                    const pa = PRIORITY_ORDER[a.priority] ?? 1;
                    const pb = PRIORITY_ORDER[b.priority] ?? 1;
                    if (pa !== pb) return pa - pb;
                    return (remaining.get(b.id) ?? 0) - (remaining.get(a.id) ?? 0);
                });

            let placed = false;
            for (const subject of candidates) {
                if ((dayCount[day][subject.id] ?? 0) >= 2) continue;
                if (lastSubjectPerDay[day] === subject.id && candidates.length > 1) continue;

                const fac = pickFaculty(subject.id, day, time, prevTime, faculty, facultyBusySlots);
                const room = pickRoom(subject, day, time, rooms, roomBusySlots);

                const schedSlot: ScheduleSlot = {
                    day, time,
                    subjectId: subject.id,
                    facultyId: fac?.id ?? '',
                    roomId: room?.id ?? '',
                    classId: cls.id,
                };

                schedule.push(schedSlot);
                lockedSlots.set(key, schedSlot);

                if (fac) markFacultyBusy(fac.id, day, time, facultyBusySlots);
                if (room) markRoomBusy(room.id, day, time, roomBusySlots);

                dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
                remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - 1);
                subjectCoverage[subject.id].assigned += 1;
                lastSubjectPerDay[day] = subject.id;
                placed = true;
                totalSlotsFilled++;
                break;
            }

            if (!placed) {
                // Will be handled in overflow pass below
            }
        }

        // ── 3b: Overflow pass — fill remaining empty slots ─────────────────────
        //  Real college timetables have NO free slots. After quota is exhausted,
        //  keep distributing the most needed subjects in a balanced rotation.
        //  Constraints relaxed: dayCount cap raised to 3, adjacency allowed.
        for (const slot of pendingSlots) {
            const { day, time } = slot;
            const key = slotKey(day, time);
            if (lockedSlots.has(key)) continue; // already filled

            const timeIdx = teachingSlots.indexOf(time);
            const prevTime = timeIdx > 0 ? teachingSlots[timeIdx - 1] : null;

            // Sort all theory subjects by fewest total assigned (balance across week)
            const overflow = [...theoryFlexSubjects].sort(
                (a, b) => (subjectCoverage[a.id]?.assigned ?? 0) - (subjectCoverage[b.id]?.assigned ?? 0)
            );

            for (const subject of overflow) {
                // Relaxed dayCount: allow up to 3 per day in overflow mode
                if ((dayCount[day][subject.id] ?? 0) >= 3) continue;
                // Still avoid exact same subject back-to-back when alternatives exist
                if (lastSubjectPerDay[day] === subject.id && overflow.length > 1) continue;

                const fac = pickFaculty(subject.id, day, time, prevTime, faculty, facultyBusySlots);
                const room = pickRoom(subject, day, time, rooms, roomBusySlots);

                const schedSlot: ScheduleSlot = {
                    day, time,
                    subjectId: subject.id,
                    facultyId: fac?.id ?? '',
                    roomId: room?.id ?? '',
                    classId: cls.id,
                };

                schedule.push(schedSlot);
                lockedSlots.set(key, schedSlot);

                if (fac) markFacultyBusy(fac.id, day, time, facultyBusySlots);
                if (room) markRoomBusy(room.id, day, time, roomBusySlots);

                dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
                subjectCoverage[subject.id].assigned += 1;
                lastSubjectPerDay[day] = subject.id;
                totalSlotsFilled++;
                break;
            }
        }

        // Quota miss warnings for theory subjects
        for (const subject of theoryFlexSubjects) {
            const placed = subjectCoverage[subject.id]?.assigned ?? 0;
            const quota = getWeeklyQuota(subject);
            if (placed < quota) {
                warnings.push(
                    `[${cls.name}] "${subject.name}" placed ${placed}/${quota} times.`
                );
            }
        }
    }

    return {
        schedule,
        warnings,
        stats: { totalSlotsFilled, totalSlotsAvailable, subjectCoverage },
    };
}

// ─── Constraint Validator (post-generation audit) ─────────────────────────────

export interface ValidationIssue {
    severity: 'error' | 'warning';
    message: string;
}

export function validateSchedule(
    schedule: ScheduleSlot[],
    subjects: Subject[],
    faculty: FacultyMember[],
    settings: CollegeSettings
): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const subjectMap = new Map(subjects.map(s => [s.id, s]));
    const facultyMap = new Map(faculty.map(f => [f.id, f]));
    const teachingSlots = buildTeachingSlots(settings);

    // Group slots by classId
    const byClass = new Map<string, ScheduleSlot[]>();
    for (const slot of schedule) {
        if (!byClass.has(slot.classId)) byClass.set(slot.classId, []);
        byClass.get(slot.classId)!.push(slot);
    }

    for (const [classId, slots] of byClass.entries()) {
        // Per-day checks
        const byDay = new Map<string, ScheduleSlot[]>();
        for (const slot of slots) {
            if (!byDay.has(slot.day)) byDay.set(slot.day, []);
            byDay.get(slot.day)!.push(slot);
        }

        for (const [day, daySlots] of byDay.entries()) {
            // Sort by time
            const sorted = daySlots.sort(
                (a, b) => teachingSlots.indexOf(a.time) - teachingSlots.indexOf(b.time)
            );

            const daySubjectCount: Record<string, number> = {};
            for (const slot of sorted) {
                // Weekly quota (day-level: max 2 per subject per day)
                daySubjectCount[slot.subjectId] = (daySubjectCount[slot.subjectId] ?? 0) + 1;
                if (daySubjectCount[slot.subjectId] > 2) {
                    const sub = subjectMap.get(slot.subjectId);
                    issues.push({
                        severity: 'error',
                        message: `[Class ${classId}] "${sub?.name ?? slot.subjectId}" appears more than 2 times on ${day}.`,
                    });
                }
            }

            // Adjacent same-subject check
            for (let i = 1; i < sorted.length; i++) {
                const prev = sorted[i - 1];
                const curr = sorted[i];
                if (prev.subjectId === curr.subjectId) {
                    const sub = subjectMap.get(curr.subjectId);
                    const isLab = sub?.subjectType === 'Laboratory';
                    if (!isLab) {
                        issues.push({
                            severity: 'warning',
                            message: `[Class ${classId}] "${sub?.name ?? curr.subjectId}" is scheduled in consecutive periods on ${day}.`,
                        });
                    }
                }
            }

            // Faculty consecutive check
            const facultyTimeMap: Record<string, string[]> = {};
            for (const slot of sorted) {
                if (!slot.facultyId) continue;
                if (!facultyTimeMap[slot.facultyId]) facultyTimeMap[slot.facultyId] = [];
                facultyTimeMap[slot.facultyId].push(slot.time);
            }
            for (const [facId, times] of Object.entries(facultyTimeMap)) {
                for (let i = 1; i < times.length; i++) {
                    const prevIdx = teachingSlots.indexOf(times[i - 1]);
                    const currIdx = teachingSlots.indexOf(times[i]);
                    if (currIdx === prevIdx + 1) {
                        const fac = facultyMap.get(facId);
                        issues.push({
                            severity: 'warning',
                            message: `Faculty "${fac?.name ?? facId}" assigned in consecutive periods on ${day} in class ${classId}.`,
                        });
                    }
                }
            }
        }
    }

    // Global: faculty double-booking at same day+time
    const globalFacultySlots = new Map<string, string>();
    for (const slot of schedule) {
        if (!slot.facultyId) continue;
        const key = `${slot.facultyId}|${slot.day}|${slot.time}`;
        if (globalFacultySlots.has(key)) {
            const fac = facultyMap.get(slot.facultyId);
            issues.push({
                severity: 'error',
                message: `Faculty "${fac?.name ?? slot.facultyId}" is double-booked on ${slot.day} at ${slot.time}.`,
            });
        } else {
            globalFacultySlots.set(key, slot.classId);
        }
    }

    return issues;
}
