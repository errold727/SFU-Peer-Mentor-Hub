import { describe, expect, it } from 'vitest';
import type { CourseMeeting, CourseOffering } from '../course/courseTypes';
import { buildTimetableModel, TIMETABLE_COLOR_COUNT } from '../course/timetableModel';
import { conflictDetails, meetingsOverlap, sharedMeetingDays } from '../course/conflictDetection';
import { displayTime } from '../course/validation';

function meeting(patch: Partial<CourseMeeting> = {}): CourseMeeting {
  const startMinutes = patch.startMinutes ?? 570,
    endMinutes = patch.endMinutes ?? 620;
  return {
    days: ['Mon'],
    startMinutes,
    endMinutes,
    displayStart: displayTime(startMinutes),
    displayEnd: displayTime(endMinutes),
    startDate: '2027-01-04',
    endDate: '2027-04-12',
    kind: 'LEC',
    location: 'Room A',
    ...patch,
  };
}
function course(number = '101', patch: Partial<CourseOffering> = {}): CourseOffering {
  return {
    term: 'Spring 2027',
    termCode: '1271',
    department: 'TEST',
    courseNumber: number,
    code: `TEST ${number}`,
    section: 'D100',
    title: 'Synthetic course',
    meetings: [meeting()],
    ...patch,
  };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const item of Object.values(value)) freeze(item);
  }
  return value;
}

describe('shared timetable model', () => {
  it('starts with the weekday 08:00–20:00 range and no selected sections', () => {
    expect(buildTimetableModel([])).toEqual({
      term: '',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startMinutes: 480,
      endMinutes: 1200,
      entries: [],
      sections: [],
      conflicts: [],
      incomplete: false,
    });
  });

  it('retains one section for three weekly meetings and all secondary blocks', () => {
    const c = course('101', {
      meetings: [
        meeting({ days: ['Mon', 'Wed', 'Fri'] }),
        meeting({ days: ['Thu'], kind: 'TUT', startMinutes: 790, endMinutes: 840 }),
      ],
    });
    const model = buildTimetableModel([c, c]);
    expect(model.sections).toHaveLength(1);
    expect(model.entries.map((e) => e.day)).toEqual(['Mon', 'Wed', 'Thu', 'Fri']);
    expect(new Set(model.entries.map((e) => e.id)).size).toBe(4);
    expect(model.sections[0].meetings).toEqual(c.meetings);
    expect(model.sections[0].status).toBe('Scheduled');
  });

  it('preserves exact placement and duration, including ten-minute meetings', () => {
    const model = buildTimetableModel([
      course('101'),
      course('102', {
        meetings: [meeting({ days: ['Tue'], startMinutes: 573, endMinutes: 583 })],
      }),
    ]);
    const [regular, short] = model.entries;
    expect(regular.meeting.startMinutes - model.startMinutes).toBe(90);
    expect(regular.meeting.endMinutes - regular.meeting.startMinutes).toBe(50);
    expect(short.meeting.startMinutes - model.startMinutes).toBe(93);
    expect(short.meeting.endMinutes - short.meeting.startMinutes).toBe(10);
  });

  it('keeps distinct block identities even when a caller reuses the same meeting object', () => {
    const repeated = meeting();
    const model = buildTimetableModel([course('101', { meetings: [repeated, repeated] })]);
    expect(model.entries).toHaveLength(2);
    expect(new Set(model.entries.map((entry) => entry.id)).size).toBe(2);
  });

  it('shows relevant weekend days and expands both edges of the axis', () => {
    const model = buildTimetableModel([
      course('101', {
        meetings: [
          meeting({ days: ['Sat'], startMinutes: 435, endMinutes: 470 }),
          meeting({ days: ['Sun'], startMinutes: 1290, endMinutes: 1320 }),
        ],
      }),
    ]);
    expect(model.days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(model.startMinutes).toBe(420);
    expect(model.endMinutes).toBe(1320);
    const saturdayOnly = buildTimetableModel([
      course('101', {
        meetings: [meeting({ days: ['Sat'] })],
      }),
    ]);
    expect(saturdayOnly.days).not.toContain('Sun');
  });

  it('keeps the full valid local day available without converting times to dates', () => {
    const model = buildTimetableModel([
      course('101', {
        meetings: [
          meeting({ startMinutes: 0, endMinutes: 10 }),
          meeting({ startMinutes: 1410, endMinutes: 1439 }),
        ],
      }),
    ]);
    expect([model.startMinutes, model.endMinutes]).toEqual([0, 1440]);
    expect(model.entries.map((e) => e.meeting.startMinutes)).toEqual([0, 1410]);
  });

  it('does not change published local times with the machine timezone', () => {
    const previous = process.env.TZ;
    try {
      process.env.TZ = 'Pacific/Auckland';
      const east = buildTimetableModel([course()]);
      process.env.TZ = 'America/Los_Angeles';
      const west = buildTimetableModel([course()]);
      expect(east).toEqual(west);
      expect(east.entries[0].meeting.displayStart).toBe('9:30 AM');
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  it('rejects mixed terms instead of overlaying them', () => {
    expect(() => buildTimetableModel([course(), course('102', { term: 'Fall 2026' })])).toThrow(
      'one term',
    );
  });

  it('allocates stable separate lanes for identical and partial three-way overlaps', () => {
    const a = course('101'),
      b = course('102', { meetings: [meeting({ endMinutes: 660 })] }),
      c = course('103', { meetings: [meeting({ startMinutes: 585, endMinutes: 640 })] });
    const model = buildTimetableModel([a, b, c]);
    expect(model.entries.map((e) => e.lane).sort()).toEqual([0, 1, 2]);
    expect(model.entries.every((e) => e.laneCount === 3 && e.conflict)).toBe(true);
    expect(model.conflicts).toHaveLength(3);
    expect(buildTimetableModel([c, a, b]).entries).toEqual(model.entries);
  });

  it('reuses lanes across connected clusters and restores full width after a gap', () => {
    const model = buildTimetableModel([
      course('101', { meetings: [meeting({ startMinutes: 540, endMinutes: 600 })] }),
      course('102', { meetings: [meeting({ startMinutes: 570, endMinutes: 630 })] }),
      course('103', { meetings: [meeting({ startMinutes: 600, endMinutes: 660 })] }),
      course('104', { meetings: [meeting({ startMinutes: 900, endMinutes: 960 })] }),
    ]);
    expect(model.entries.map((e) => [e.lane, e.laneCount])).toEqual([
      [0, 2],
      [1, 2],
      [0, 2],
      [0, 1],
    ]);
    expect(model.conflicts).toHaveLength(2);
  });

  it('does not report adjacent classes as overlapping or shrink their blocks', () => {
    const model = buildTimetableModel([
      course(),
      course('102', {
        meetings: [meeting({ startMinutes: 620, endMinutes: 670 })],
      }),
    ]);
    expect(model.conflicts).toEqual([]);
    expect(model.entries.every((e) => !e.conflict && e.lane === 0 && e.laneCount === 1)).toBe(true);
  });

  it('separates visual overlap lanes from non-overlapping teaching dates', () => {
    const model = buildTimetableModel([
      course('101', { meetings: [meeting({ endDate: '2027-01-25' })] }),
      course('102', { meetings: [meeting({ startDate: '2027-03-01' })] }),
    ]);
    expect(model.conflicts).toEqual([]);
    expect(model.entries.map((e) => [e.lane, e.laneCount, e.conflict])).toEqual([
      [0, 2, false],
      [1, 2, false],
    ]);
    expect(model.incomplete).toBe(false);
  });

  it('reports and marks only weekdays that actually occur within the shared date range', () => {
    const a = course('101', {
      meetings: [meeting({ days: ['Mon', 'Wed'], endDate: '2027-01-06' })],
    });
    const b = course('102', {
      meetings: [meeting({ days: ['Mon', 'Wed'], startDate: '2027-01-05', endDate: '2027-01-13' })],
    });
    expect(sharedMeetingDays(a.meetings[0], b.meetings[0])).toEqual(['Wed']);
    const details = conflictDetails(a, b);
    expect(details).toHaveLength(1);
    expect(details[0]).toMatch(/^Wed · 9:30 AM–10:20 AM/);
    expect(details[0]).not.toContain('Mon');
    const model = buildTimetableModel([a, b]);
    expect(model.entries.filter((e) => e.day === 'Mon').every((e) => !e.conflict)).toBe(true);
    expect(model.entries.filter((e) => e.day === 'Wed').every((e) => e.conflict)).toBe(true);
    expect(model.conflicts[0].details).toEqual(details);
  });

  it('requires an actual weekday in a short overlapping date range', () => {
    const a = meeting({ endDate: '2027-01-07' });
    const b = meeting({ startDate: '2027-01-05', endDate: '2027-01-18' });
    expect(meetingsOverlap(a, b)).toBe(false);
    expect(
      buildTimetableModel([course('101', { meetings: [a] }), course('102', { meetings: [b] })])
        .conflicts,
    ).toEqual([]);
  });

  it('recognizes conflicts in secondary tutorial blocks without relying on section patterns', () => {
    const a = course('101', { meetings: [meeting(), meeting({ days: ['Thu'], kind: 'TUT' })] });
    const b = course('102', { meetings: [meeting({ days: ['Thu'], kind: 'LAB' })] });
    const model = buildTimetableModel([a, b]);
    expect(model.conflicts).toHaveLength(1);
    expect(model.conflicts[0].details[0]).toContain('(TUT)');
    expect(model.entries.filter((e) => e.conflict).map((e) => e.day)).toEqual(['Thu', 'Thu']);
  });

  it('does not turn travel between campuses into a time conflict', () => {
    const model = buildTimetableModel([
      course('101', { campus: 'Burnaby' }),
      course('102', {
        campus: 'Surrey',
        meetings: [meeting({ startMinutes: 620, endMinutes: 670 })],
      }),
    ]);
    expect(model.conflicts).toEqual([]);
  });

  it('uses one stable color per course and term, independent of section and selection order', () => {
    const a = course(),
      b = course('101', { section: 'D200' }),
      c = course('102');
    const first = buildTimetableModel([a, b]);
    const after = buildTimetableModel([c, b, a]);
    expect(new Set(first.entries.map((e) => e.colorIndex)).size).toBe(1);
    expect(after.entries.find((e) => e.course.code === a.code)?.colorIndex).toBe(
      first.entries[0].colorIndex,
    );
    expect(
      after.entries.every((e) => e.colorIndex >= 0 && e.colorIndex < TIMETABLE_COLOR_COUNT),
    ).toBe(true);
  });

  it('retains unavailable sections and does not infer asynchronous delivery from Online or no meetings', () => {
    const model = buildTimetableModel([
      course('101', { meetings: [] }),
      course('102', { meetings: [], deliveryMethod: 'Online' }),
    ]);
    expect(model.sections).toHaveLength(2);
    expect(model.entries).toEqual([]);
    expect(model.sections.every((s) => s.status === 'Schedule unavailable')).toBe(true);
    expect(model.incomplete).toBe(true);
    expect(
      model.sections.every((s) => s.warning?.includes('does not establish asynchronous')),
    ).toBe(true);
  });

  it('recognizes only explicit unambiguous asynchronous delivery labels', () => {
    const model = buildTimetableModel([
      course('101', { meetings: [], deliveryMethod: 'Asynchronous' }),
    ]);
    expect(model.sections[0].status).toBe('Asynchronous — no scheduled meetings');
    expect(model.incomplete).toBe(false);
    const uncertain = buildTimetableModel([
      course('102', { meetings: [], deliveryMethod: 'Synchronous / Asynchronous' }),
    ]);
    expect(uncertain.sections[0].status).toBe('Schedule unavailable');
    const contradictory = buildTimetableModel([course('103', { deliveryMethod: 'Asynchronous' })]);
    expect(contradictory.entries).toHaveLength(1);
    expect(contradictory.incomplete).toBe(true);
  });

  it('renders known blocks while retaining the importer’s partial-schedule warning', () => {
    const c = course('101', {
      scheduleNote: '1 meeting block(s) have unavailable times. Check the official outline.',
    });
    const model = buildTimetableModel([c]);
    expect(model.entries).toHaveLength(1);
    expect(model.sections[0].status).toBe('Partially published schedule');
    expect(model.sections[0].warning).toContain(c.scheduleNote);
    expect(model.incomplete).toBe(true);
  });

  it.each([
    { startDate: undefined, endDate: undefined },
    { startDate: undefined },
    { endDate: undefined },
  ])('renders missing-date patterns but cannot confirm an actual conflict: %j', (patch) => {
    const model = buildTimetableModel([
      course('101', { meetings: [meeting(patch)] }),
      course('102'),
    ]);
    expect(model.entries).toHaveLength(2);
    expect(model.entries.every((e) => e.laneCount === 2 && !e.conflict)).toBe(true);
    expect(model.conflicts).toEqual([]);
    expect(model.incomplete).toBe(true);
  });

  it.each([
    { days: [] },
    { days: ['Monday'] },
    { days: ['Mon', 'Mon'] },
    { startMinutes: -1 },
    { endMinutes: 1440 },
    { startMinutes: 570.5 },
    { startMinutes: Number.NaN },
    { startMinutes: 620, endMinutes: 620 },
    { displayStart: 'Noon' },
    { startDate: '2027-02-30' },
    { startDate: '2027-04-13', endDate: '2027-04-12' },
    { days: ['Mon'], startDate: '2027-01-06', endDate: '2027-01-06' },
  ])('quarantines invalid blocks and keeps the selected section visible: %j', (patch) => {
    const model = buildTimetableModel([course('101', { meetings: [meeting(patch)] })]);
    expect(model.sections).toHaveLength(1);
    expect(model.sections[0].status).toBe('Invalid/incomplete meeting data');
    expect(model.sections[0].unplacedCount).toBe(1);
    expect(model.entries).toEqual([]);
    expect(model.incomplete).toBe(true);
  });

  it('quarantines only invalid blocks in an otherwise known schedule', () => {
    const model = buildTimetableModel([
      course('101', { meetings: [meeting(), meeting({ days: ['TBA'] })] }),
    ]);
    expect(model.sections[0].status).toBe('Partially published schedule');
    expect(model.sections[0].unplacedCount).toBe(1);
    expect(model.entries).toHaveLength(1);
  });

  it('keeps examinations separate from the recurring teaching grid', () => {
    const exam = meeting({
      days: ['Wed'],
      kind: 'EXAM',
      startDate: '2027-04-14',
      endDate: '2027-04-14',
    });
    const model = buildTimetableModel([course('101', { meetings: [meeting(), exam] })]);
    expect(model.entries).toHaveLength(1);
    expect(model.sections[0].exams).toEqual([exam]);
    expect(model.sections[0].meetings).toHaveLength(1);
    const examOnly = buildTimetableModel([course('102', { meetings: [exam] })]);
    expect(examOnly.sections[0].status).toBe('Examination details only');
    expect(examOnly.incomplete).toBe(true);
    expect(examOnly.entries).toEqual([]);
  });

  it('checks one-day exam occurrences without treating an ambiguous exam range as recurrence', () => {
    const a = course('101', {
      meetings: [
        meeting({ days: ['Wed'], kind: 'FINAL', startDate: '2027-04-07', endDate: '2027-04-07' }),
      ],
    });
    const b = course('102', { meetings: [meeting({ days: ['Wed'] })] });
    expect(buildTimetableModel([a, b]).conflicts).toHaveLength(1);
    const uncertain = course('103', {
      meetings: [
        meeting({ days: ['Wed'], kind: 'FINAL', startDate: '2027-04-07', endDate: '2027-04-14' }),
      ],
    });
    const model = buildTimetableModel([uncertain, b]);
    expect(model.conflicts).toEqual([]);
    expect(model.sections[0].exams).toHaveLength(1);
    expect(model.incomplete).toBe(true);
  });

  it('preserves original data and does not mutate frozen published meetings during layout', () => {
    const selection = freeze([
      course('101', { meetings: [meeting({ days: ['Fri', 'Mon'] })] }),
      course('102'),
    ]);
    const before = JSON.stringify(selection);
    const model = buildTimetableModel(selection);
    expect(JSON.stringify(selection)).toBe(before);
    expect(model.entries[0].course).toBe(selection[0]);
    expect(model.entries[0].meeting).toBe(selection[0].meetings[0]);
  });
});
