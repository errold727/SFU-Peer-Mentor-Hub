import { courseId, type CourseOffering } from './courseTypes';
import { meetingsOverlap } from './conflictDetection';
import { Timetable } from './Timetable';
export function WeeklySchedule({ courses }: { courses: CourseOffering[] }) {
  return (
    <details className="weekly-schedule">
      <summary>Weekly timetable · selected sections</summary>
      {[...new Set(courses.map((c) => c.term))].map((term) => (
        <section key={term}>
          <h3>{term}</h3>
          <Timetable courses={courses.filter((c) => c.term === term)} />
          <h4>Full meeting details</h4>
          <div className="week-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
              const meetings = courses
                .filter((c) => c.term === term)
                .flatMap((c) =>
                  c.meetings.filter((m) => m.days.includes(day)).map((m, i) => ({ c, m, i })),
                )
                .sort((a, b) => a.m.startMinutes - b.m.startMinutes);
              return (
                <div className="week-day" key={day}>
                  <h4>{day}</h4>
                  {meetings.length ? (
                    meetings.map(({ c, m, i }) => (
                      <p
                        key={courseId(c) + i}
                        className={
                          meetings.some(
                            (other) =>
                              courseId(other.c) !== courseId(c) && meetingsOverlap(m, other.m),
                          )
                            ? 'meeting-conflict'
                            : undefined
                        }
                      >
                        <strong>
                          {c.code} {c.section}
                        </strong>
                        <br />
                        {m.displayStart}–{m.displayEnd}
                        {meetings.some(
                          (other) =>
                            courseId(other.c) !== courseId(c) && meetingsOverlap(m, other.m),
                        ) && (
                          <>
                            <br />
                            <strong>Overlapping meeting</strong>
                          </>
                        )}
                        <br />
                        <small>
                          {m.kind ?? c.sectionType}
                          {m.startDate && ` · ${m.startDate}–${m.endDate ?? '?'}`}
                        </small>
                      </p>
                    ))
                  ) : (
                    <p className="muted">No listed meetings</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <p className="muted">
        Only published meeting blocks are shown. Overlapping times appear in the conflict summary
        above.
      </p>
    </details>
  );
}
