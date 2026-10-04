import type { CourseOffering } from './courseTypes';
import { courseId } from './courseTypes';
import { meetingsOverlap } from './conflictDetection';
import { displayTime } from './validation';
// Visual companion to the complete, accessible day-by-day meeting list below.
export function Timetable({ courses }: { courses: CourseOffering[] }) {
  const entries = courses.flatMap((c) => c.meetings.map((m, i) => ({ c, m, i })));
  if (!entries.length) return null;
  const days = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    ...['Sat', 'Sun'].filter((d) => entries.some((e) => e.m.days.includes(d))),
  ];
  const start = Math.min(480, ...entries.map((e) => Math.floor(e.m.startMinutes / 60) * 60));
  const end = Math.max(1080, ...entries.map((e) => Math.ceil(e.m.endMinutes / 60) * 60));
  const height = end - start;
  return (
    <div
      className="timetable-scroll"
      tabIndex={0}
      role="region"
      aria-label="Weekly time grid, scroll horizontally; full meeting details follow"
    >
      <div
        className="timetable"
        style={{ gridTemplateColumns: `65px repeat(${days.length}, minmax(150px,1fr))` }}
        aria-hidden="true"
      >
        <div className="time-axis" style={{ height: height + 36 }}>
          {Array.from({ length: (end - start) / 60 + 1 }, (_, i) => (
            <span key={i} style={{ top: 36 + i * 60 }}>
              {displayTime(start + i * 60)}
            </span>
          ))}
        </div>
        {days.map((day) => {
          const meetings = entries
            .filter((e) => e.m.days.includes(day))
            .sort((a, b) => a.m.startMinutes - b.m.startMinutes);
          const ends: number[] = [];
          const positioned = meetings.map((e) => {
            let lane = ends.findIndex((end) => end <= e.m.startMinutes);
            if (lane === -1) lane = ends.length;
            ends[lane] = e.m.endMinutes;
            return { ...e, lane };
          });
          const lanes = Math.max(1, ends.length);
          return (
            <div className="time-day" key={day}>
              <strong>{day}</strong>
              <div className="time-track" style={{ height }}>
                {positioned.map(({ c, m, i, lane }) => {
                  const conflict = meetings.some(
                    (other) => courseId(other.c) !== courseId(c) && meetingsOverlap(m, other.m),
                  );
                  return (
                    <div
                      className={`time-block${conflict ? ' time-conflict' : ''}`}
                      key={courseId(c) + i}
                      style={{
                        top: m.startMinutes - start,
                        height: m.endMinutes - m.startMinutes,
                        left: `${(lane * 100) / lanes}%`,
                        width: `${100 / lanes}%`,
                      }}
                      title={`${c.code} ${c.section} · ${m.displayStart}–${m.displayEnd}${conflict ? ' · Overlap' : ''}`}
                    >
                      <b>{c.code}</b>
                      <br />
                      {c.section}
                      {conflict ? ' · Overlap' : ''}
                      <br />
                      {m.displayStart}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
