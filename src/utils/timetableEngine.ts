/**
 * ============================================================
 *  Timegen — Advanced Constraint-Satisfaction Timetable Engine
 * ============================================================
 *
 *  Core Design Principles:
 *  ─────────────────────────────────────────────────────────
 *  1. UNIQUE timetables per class — even identical subject sets produce
 *     structurally different schedules via controlled randomisation.
 *  2. Hard constraints NEVER violated:
 *     • No faculty double-booking across classes
 *     • No room double-booking across classes
 *     • Weekly period quotas respected
 *  3. Soft constraints maximised:
 *     • Even subject distribution across the week
 *     • No consecutive same-subject (unless lab)
 *     • Faculty spacing (avoid back-to-back)
 *  4. Diversity enforcement — similarity score between class timetables
 *     is measured; if too high, the class is re-generated with a
 *     different random seed.
 *
 *  Generation Pipeline (per class):
 *  ─────────────────────────────────
 *  Phase 1: Fixed-slot pre-allocation (Library, NPTEL, TWS, Placement)
 *  Phase 2: Laboratory block scheduling (≥2 consecutive periods)
 *  Phase 3: Theory subjects — priority-based CSP with randomised ordering
 *  Phase 4: Overflow fill — remaining empty slots get balanced theory
 *  Phase 5: Diversity check — re-run if similarity exceeds threshold
 */

import { Subject, FacultyMember, ClassSection, Room, CollegeSettings, ScheduleSlot } from '../types';
import { buildTeachingSlots } from './schedule';


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

type SlotKey = string;

const FIXED_KEYWORDS = ['library', 'nptel', 'tws', 'placement'];

const LAB_BLOCK_SIZE = 2;

const SIMILARITY_THRESHOLD = 0.65;

const MAX_DIVERSITY_RETRIES = 5;

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };


const slotKey = (day: string, time: string): SlotKey => `${day}|${time}`;

const isFixedSubject = (subject: Subject): boolean => {
    const lower = subject.name.toLowerCase();
    return FIXED_KEYWORDS.some(kw => lower.includes(kw));
};

const isLabSubject = (subject: Subject): boolean =>
    subject.subjectType === 'Laboratory';

const getWeeklyQuota = (subject: Subject): number => {
    const raw = (subject as Subject & { weeklyPeriods?: number }).weeklyPeriods;
    return typeof raw === 'number' && raw > 0 ? raw : Math.max(1, subject.hours);
};

function shuffle<T>(arr: T[], rng: () => number): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createRng(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function classHash(classId: string, attempt: number): number {
    let hash = attempt * 2654435761;
    for (let i = 0; i < classId.length; i++) {
        hash = ((hash << 5) - hash + classId.charCodeAt(i)) | 0;
    }
    return hash;
}


function pickFaculty(
    subjectId: string,
    day: string,
    time: string,
    prevTime: string | null,
    allFaculty: FacultyMember[],
    facultyBusySlots: Map<string, Set<SlotKey>>,
    rng: () => number
): FacultyMember | null {
    const qualified = allFaculty.filter(f => {
        if (!f.subjects.includes(subjectId)) return false;
        if (f.availability && f.availability.length > 0 && !f.availability.includes(day)) return false;
        return true;
    });

    const shuffled = shuffle([...qualified], rng);

    const currentKey = slotKey(day, time);
    const prevKey = prevTime ? slotKey(day, prevTime) : null;

    for (const f of shuffled) {
        const busy = facultyBusySlots.get(f.id) ?? new Set();
        if (busy.has(currentKey)) continue;
        if (prevKey && busy.has(prevKey)) continue;
        return f;
    }

    for (const f of shuffled) {
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
    roomBusySlots: Map<string, Set<SlotKey>>,
    rng: () => number
): Room | null {
    const preferredType = subject.subjectType === 'Laboratory' ? 'Lab' : 'Classroom';
    const preferred = rooms.filter(r => r.type === preferredType);
    const fallback = rooms.filter(r => r.type !== preferredType);

    const ordered = [...shuffle([...preferred], rng), ...shuffle([...fallback], rng)];
    const key = slotKey(day, time);
    return ordered.find(r => !(roomBusySlots.get(r.id)?.has(key))) ?? null;
}

function markBusy(
    entityId: string,
    day: string,
    time: string,
    busySlots: Map<string, Set<SlotKey>>
): void {
    if (!busySlots.has(entityId)) busySlots.set(entityId, new Set());
    busySlots.get(entityId)!.add(slotKey(day, time));
}


function computeSimilarity(
    schedA: ScheduleSlot[],
    schedB: ScheduleSlot[],
): number {
    if (schedA.length === 0 || schedB.length === 0) return 0;

    const mapA = new Map<string, string>();
    const mapB = new Map<string, string>();

    for (const s of schedA) mapA.set(slotKey(s.day, s.time), s.subjectId);
    for (const s of schedB) mapB.set(slotKey(s.day, s.time), s.subjectId);

    let matches = 0;
    let total = 0;

    for (const [key, subjectId] of mapA) {
        if (mapB.has(key)) {
            total++;
            if (mapB.get(key) === subjectId) matches++;
        }
    }

    return total === 0 ? 0 : matches / total;
}


interface ClassGenResult {
    slots: ScheduleSlot[];
    warnings: string[];
    coverage: Record<string, { assigned: number; quota: number }>;
    slotsUsed: number;
    slotsAvailable: number;
}

function generateForClass(
    cls: ClassSection,
    allSubjects: Subject[],
    allFaculty: FacultyMember[],
    rooms: Room[],
    settings: CollegeSettings,
    globalFacultyBusy: Map<string, Set<SlotKey>>,
    globalRoomBusy: Map<string, Set<SlotKey>>,
    rng: () => number,
): ClassGenResult {
    const { workingDays } = settings;
    const teachingSlots = buildTeachingSlots(settings);

    const slots: ScheduleSlot[] = [];
    const warnings: string[] = [];
    const coverage: Record<string, { assigned: number; quota: number }> = {};

    if (cls.subjects.length === 0) {
        return { slots, warnings, coverage, slotsUsed: 0, slotsAvailable: 0 };
    }

    const clsSubjects = cls.subjects
        .map(id => allSubjects.find(s => s.id === id))
        .filter((s): s is Subject => s !== undefined);

    const remaining = new Map<string, number>();
    for (const s of clsSubjects) {
        remaining.set(s.id, getWeeklyQuota(s));
        coverage[s.id] = { assigned: 0, quota: getWeeklyQuota(s) };
    }

    const dayCount: Record<string, Record<string, number>> = {};
    for (const day of workingDays) {
        dayCount[day] = {};
        for (const s of clsSubjects) dayCount[day][s.id] = 0;
    }

    const lockedSlots = new Map<SlotKey, ScheduleSlot>();

    const lastSubjectPerDay: Record<string, string> = {};

    const fixedSubjects = clsSubjects.filter(s => isFixedSubject(s) && !isLabSubject(s));
    const labSubjects = clsSubjects.filter(isLabSubject);
    const theorySubjects = clsSubjects.filter(s => !isFixedSubject(s) && !isLabSubject(s));

    const fixedDayOrder = shuffle([...workingDays], rng);
    shuffle(fixedSubjects, rng); // randomise order among fixed subjects too

    for (const subject of fixedSubjects) {
        let placed = 0;
        const quota = remaining.get(subject.id) ?? 1;

        for (const day of fixedDayOrder) {
            if (placed >= quota) break;
            if ((dayCount[day][subject.id] ?? 0) >= 2) continue;

            const timeOrder = shuffle([...teachingSlots], rng);
            for (const time of timeOrder) {
                if (placed >= quota) break;
                const key = slotKey(day, time);
                if (lockedSlots.has(key)) continue;

                const prevTimeIdx = teachingSlots.indexOf(time);
                const prevTime = prevTimeIdx > 0 ? teachingSlots[prevTimeIdx - 1] : null;

                const fac = pickFaculty(subject.id, day, time, prevTime, allFaculty, globalFacultyBusy, rng);
                const room = pickRoom(subject, day, time, rooms, globalRoomBusy, rng);

                const slot: ScheduleSlot = {
                    day, time,
                    subjectId: subject.id,
                    facultyId: fac?.id ?? '',
                    roomId: room?.id ?? '',
                    classId: cls.id,
                };

                lockedSlots.set(key, slot);
                slots.push(slot);

                if (fac) markBusy(fac.id, day, time, globalFacultyBusy);
                if (room) markBusy(room.id, day, time, globalRoomBusy);

                dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
                remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - 1);
                coverage[subject.id].assigned++;
                placed++;
            }
        }

        if (placed < quota) {
            warnings.push(`[${cls.name}] Fixed subject "${subject.name}" placed ${placed}/${quota}.`);
        }
    }

    shuffle(labSubjects, rng);

    for (const subject of labSubjects) {
        let placed = 0;
        const quota = remaining.get(subject.id) ?? 2;
        const blocksNeeded = Math.ceil(quota / LAB_BLOCK_SIZE);

        const labDayOrder = shuffle([...workingDays], rng);

        for (let blockIdx = 0; blockIdx < blocksNeeded; blockIdx++) {
            let blockPlaced = false;

            for (const day of labDayOrder) {
                if (blockPlaced) break;

                const startPositions: number[] = [];
                for (let i = 0; i <= teachingSlots.length - LAB_BLOCK_SIZE; i++) {
                    startPositions.push(i);
                }
                shuffle(startPositions, rng);

                for (const startIdx of startPositions) {
                    const times = teachingSlots.slice(startIdx, startIdx + LAB_BLOCK_SIZE);

                    if (!times.every(t => !lockedSlots.has(slotKey(day, t)))) continue;

                    const currentDayCount = dayCount[day][subject.id] ?? 0;
                    if (currentDayCount + LAB_BLOCK_SIZE > 2) continue;

                    const fac = pickFaculty(subject.id, day, times[0], null, allFaculty, globalFacultyBusy, rng);
                    if (!fac) continue;

                    const facBusy = globalFacultyBusy.get(fac.id) ?? new Set();
                    if (!times.every(t => !facBusy.has(slotKey(day, t)))) continue;

                    const room = pickRoom(subject, day, times[0], rooms, globalRoomBusy, rng);

                    if (room) {
                        const roomBusy = globalRoomBusy.get(room.id) ?? new Set();
                        if (!times.every(t => !roomBusy.has(slotKey(day, t)))) continue;
                    }

                    for (const t of times) {
                        const key = slotKey(day, t);
                        const slot: ScheduleSlot = {
                            day, time: t,
                            subjectId: subject.id,
                            facultyId: fac.id,
                            roomId: room?.id ?? '',
                            classId: cls.id,
                        };
                        lockedSlots.set(key, slot);
                        slots.push(slot);
                        markBusy(fac.id, day, t, globalFacultyBusy);
                        if (room) markBusy(room.id, day, t, globalRoomBusy);
                    }

                    dayCount[day][subject.id] = currentDayCount + LAB_BLOCK_SIZE;
                    remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - LAB_BLOCK_SIZE);
                    coverage[subject.id].assigned += LAB_BLOCK_SIZE;
                    placed += LAB_BLOCK_SIZE;
                    blockPlaced = true;
                    break;
                }
            }

            if (!blockPlaced) {
                warnings.push(`[${cls.name}] Lab "${subject.name}" could not place block ${blockIdx + 1}.`);
            }
        }

        if (placed < quota) {
            warnings.push(`[${cls.name}] Lab "${subject.name}" placed ${placed}/${quota}.`);
        }
    }

    theorySubjects.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 1;
        const pb = PRIORITY_ORDER[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return getWeeklyQuota(b) - getWeeklyQuota(a);
    });

    type PendingSlot = { day: string; slotIdx: number; time: string };
    const pendingSlots: PendingSlot[] = [];

    const theoryDayOrder = shuffle([...workingDays], rng);
    for (let si = 0; si < teachingSlots.length; si++) {
        for (const day of theoryDayOrder) {
            pendingSlots.push({ day, slotIdx: si, time: teachingSlots[si] });
        }
    }
    for (let i = 0; i < pendingSlots.length - 1; i++) {
        const maxJ = Math.min(i + 3, pendingSlots.length - 1);
        const j = i + Math.floor(rng() * (maxJ - i + 1));
        [pendingSlots[i], pendingSlots[j]] = [pendingSlots[j], pendingSlots[i]];
    }

    let slotsAvailable = 0;
    let slotsUsed = 0;

    for (const { day, time } of pendingSlots) {
        slotsAvailable++;
        const key = slotKey(day, time);

        if (lockedSlots.has(key)) {
            slotsUsed++;
            continue;
        }

        const timeIdx = teachingSlots.indexOf(time);
        const prevTime = timeIdx > 0 ? teachingSlots[timeIdx - 1] : null;

        const candidates = theorySubjects
            .filter(s => (remaining.get(s.id) ?? 0) > 0)
            .sort((a, b) => {
                const pa = PRIORITY_ORDER[a.priority] ?? 1;
                const pb = PRIORITY_ORDER[b.priority] ?? 1;
                if (pa !== pb) return pa - pb;
                const remDiff = (remaining.get(b.id) ?? 0) - (remaining.get(a.id) ?? 0);
                if (remDiff !== 0) return remDiff;
                return (dayCount[day][a.id] ?? 0) - (dayCount[day][b.id] ?? 0);
            });

        let placed = false;
        for (const subject of candidates) {
            if ((dayCount[day][subject.id] ?? 0) >= 2) continue;
            if (lastSubjectPerDay[day] === subject.id && candidates.length > 1) continue;

            const fac = pickFaculty(subject.id, day, time, prevTime, allFaculty, globalFacultyBusy, rng);
            const room = pickRoom(subject, day, time, rooms, globalRoomBusy, rng);

            const schedSlot: ScheduleSlot = {
                day, time,
                subjectId: subject.id,
                facultyId: fac?.id ?? '',
                roomId: room?.id ?? '',
                classId: cls.id,
            };

            slots.push(schedSlot);
            lockedSlots.set(key, schedSlot);

            if (fac) markBusy(fac.id, day, time, globalFacultyBusy);
            if (room) markBusy(room.id, day, time, globalRoomBusy);

            dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
            remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - 1);
            coverage[subject.id].assigned++;
            lastSubjectPerDay[day] = subject.id;
            placed = true;
            slotsUsed++;
            break;
        }
    }

    const overflowOrder = shuffle([...pendingSlots], rng);

    for (const { day, time } of overflowOrder) {
        const key = slotKey(day, time);
        if (lockedSlots.has(key)) continue;

        const timeIdx = teachingSlots.indexOf(time);
        const prevTime = timeIdx > 0 ? teachingSlots[timeIdx - 1] : null;

        const overflow = [...theorySubjects].sort((a, b) => {
            const aDayCount = dayCount[day][a.id] ?? 0;
            const bDayCount = dayCount[day][b.id] ?? 0;
            if (aDayCount !== bDayCount) return aDayCount - bDayCount;
            return (coverage[a.id]?.assigned ?? 0) - (coverage[b.id]?.assigned ?? 0);
        });

        for (const subject of overflow) {
            if ((dayCount[day][subject.id] ?? 0) >= 3) continue;
            if (lastSubjectPerDay[day] === subject.id && overflow.length > 1) continue;

            const fac = pickFaculty(subject.id, day, time, prevTime, allFaculty, globalFacultyBusy, rng);
            const room = pickRoom(subject, day, time, rooms, globalRoomBusy, rng);

            const schedSlot: ScheduleSlot = {
                day, time,
                subjectId: subject.id,
                facultyId: fac?.id ?? '',
                roomId: room?.id ?? '',
                classId: cls.id,
            };

            slots.push(schedSlot);
            lockedSlots.set(key, schedSlot);

            if (fac) markBusy(fac.id, day, time, globalFacultyBusy);
            if (room) markBusy(room.id, day, time, globalRoomBusy);

            dayCount[day][subject.id] = (dayCount[day][subject.id] ?? 0) + 1;
            coverage[subject.id].assigned++;
            lastSubjectPerDay[day] = subject.id;
            slotsUsed++;
            break;
        }
    }

    for (const subject of theorySubjects) {
        const placed = coverage[subject.id]?.assigned ?? 0;
        const quota = getWeeklyQuota(subject);
        if (placed < quota) {
            warnings.push(`[${cls.name}] "${subject.name}" placed ${placed}/${quota} times.`);
        }
    }

    return { slots, warnings, coverage, slotsUsed, slotsAvailable };
}


export function generateTimetable(input: EngineInput): EngineResult {
    const { subjects, faculty, classes, rooms, settings } = input;

    const allSchedule: ScheduleSlot[] = [];
    const allWarnings: string[] = [];
    let totalSlotsFilled = 0;
    let totalSlotsAvailable = 0;
    const subjectCoverage: Record<string, { assigned: number; quota: number }> = {};

    for (const s of subjects) {
        subjectCoverage[s.id] = { assigned: 0, quota: getWeeklyQuota(s) };
    }

    const globalFacultyBusy = new Map<string, Set<SlotKey>>();
    const globalRoomBusy = new Map<string, Set<SlotKey>>();

    const classResults = new Map<string, ScheduleSlot[]>();

    const classOrder = [...classes];
    const masterRng = createRng(Date.now());
    shuffle(classOrder, masterRng);

    for (let classIdx = 0; classIdx < classOrder.length; classIdx++) {
        const cls = classOrder[classIdx];
        if (cls.subjects.length === 0) continue;

        let bestResult: ClassGenResult | null = null;
        let bestSimilarityScore = 1; // lower is better

        for (let attempt = 0; attempt < MAX_DIVERSITY_RETRIES; attempt++) {
            const seed = classHash(cls.id, attempt) ^ (Date.now() + classIdx * 7919);
            const rng = createRng(seed);

            const trialFacultyBusy = new Map<string, Set<SlotKey>>();
            for (const [k, v] of globalFacultyBusy) {
                trialFacultyBusy.set(k, new Set(v));
            }
            const trialRoomBusy = new Map<string, Set<SlotKey>>();
            for (const [k, v] of globalRoomBusy) {
                trialRoomBusy.set(k, new Set(v));
            }

            const result = generateForClass(
                cls, subjects, faculty, rooms, settings,
                trialFacultyBusy, trialRoomBusy, rng
            );

            let maxSim = 0;
            for (const [, prevSlots] of classResults) {
                const sim = computeSimilarity(result.slots, prevSlots);
                maxSim = Math.max(maxSim, sim);
            }

            if (classResults.size === 0) {
                bestResult = result;
                bestSimilarityScore = 0;
                for (const [k, v] of trialFacultyBusy) globalFacultyBusy.set(k, v);
                for (const [k, v] of trialRoomBusy) globalRoomBusy.set(k, v);
                break;
            }

            if (maxSim < SIMILARITY_THRESHOLD) {
                bestResult = result;
                bestSimilarityScore = maxSim;
                for (const [k, v] of trialFacultyBusy) globalFacultyBusy.set(k, v);
                for (const [k, v] of trialRoomBusy) globalRoomBusy.set(k, v);
                break;
            }

            if (maxSim < bestSimilarityScore || bestResult === null) {
                bestResult = result;
                bestSimilarityScore = maxSim;
                (bestResult as ClassGenResult & { _trialFaculty?: Map<string, Set<SlotKey>>; _trialRoom?: Map<string, Set<SlotKey>> })._trialFaculty = trialFacultyBusy;
                (bestResult as ClassGenResult & { _trialRoom?: Map<string, Set<SlotKey>> })._trialRoom = trialRoomBusy;
            }
        }

        if (bestResult) {
            const trialF = (bestResult as ClassGenResult & { _trialFaculty?: Map<string, Set<SlotKey>> })._trialFaculty;
            const trialR = (bestResult as ClassGenResult & { _trialRoom?: Map<string, Set<SlotKey>> })._trialRoom;
            if (trialF) {
                for (const [k, v] of trialF) globalFacultyBusy.set(k, v);
            }
            if (trialR) {
                for (const [k, v] of trialR) globalRoomBusy.set(k, v);
            }

            allSchedule.push(...bestResult.slots);
            allWarnings.push(...bestResult.warnings);
            totalSlotsFilled += bestResult.slotsUsed;
            totalSlotsAvailable += bestResult.slotsAvailable;

            for (const [subId, cov] of Object.entries(bestResult.coverage)) {
                subjectCoverage[subId] = subjectCoverage[subId] ?? { assigned: 0, quota: cov.quota };
                subjectCoverage[subId].assigned += cov.assigned;
            }

            classResults.set(cls.id, bestResult.slots);

            if (bestSimilarityScore >= SIMILARITY_THRESHOLD) {
                allWarnings.push(
                    `[${cls.name}] Timetable similarity (${(bestSimilarityScore * 100).toFixed(0)}%) exceeds threshold — limited faculty/room availability may constrain diversity.`
                );
            }
        }
    }

    return {
        schedule: allSchedule,
        warnings: allWarnings,
        stats: { totalSlotsFilled, totalSlotsAvailable, subjectCoverage },
    };
}


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

    const byClass = new Map<string, ScheduleSlot[]>();
    for (const slot of schedule) {
        if (!byClass.has(slot.classId)) byClass.set(slot.classId, []);
        byClass.get(slot.classId)!.push(slot);
    }

    for (const [classId, slots] of byClass.entries()) {
        const byDay = new Map<string, ScheduleSlot[]>();
        for (const slot of slots) {
            if (!byDay.has(slot.day)) byDay.set(slot.day, []);
            byDay.get(slot.day)!.push(slot);
        }

        for (const [day, daySlots] of byDay.entries()) {
            const sorted = daySlots.sort(
                (a, b) => teachingSlots.indexOf(a.time) - teachingSlots.indexOf(b.time)
            );

            const daySubjectCount: Record<string, number> = {};
            for (const slot of sorted) {
                daySubjectCount[slot.subjectId] = (daySubjectCount[slot.subjectId] ?? 0) + 1;
                if (daySubjectCount[slot.subjectId] > 2) {
                    const sub = subjectMap.get(slot.subjectId);
                    issues.push({
                        severity: 'error',
                        message: `[Class ${classId}] "${sub?.name ?? slot.subjectId}" appears more than 2 times on ${day}.`,
                    });
                }
            }

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

    const globalRoomSlots = new Map<string, string>();
    for (const slot of schedule) {
        if (!slot.roomId) continue;
        const key = `${slot.roomId}|${slot.day}|${slot.time}`;
        if (globalRoomSlots.has(key)) {
            issues.push({
                severity: 'error',
                message: `Room double-booked on ${slot.day} at ${slot.time}.`,
            });
        } else {
            globalRoomSlots.set(key, slot.classId);
        }
    }

    return issues;
}
