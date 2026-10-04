import { useId } from 'react';
import { courseId, type CourseMeeting, type CourseOffering } from './courseTypes';
import type { TimetableModel } from './timetableModel';
import { Timetable } from './Timetable';

const dayNames: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
function dateRange(meeting: CourseMeeting) {
  if (!meeting.startDate && !meeting.endDate) return 'Dates unavailable';
  if (meeting.startDate === meeting.endDate) return meeting.startDate;
  return `${meeting.startDate ?? 'Start date unavailable'}–${meeting.endDate ?? 'end date unavailable'}`;
}
function timeRange(meeting: CourseMeeting) {
  return Number.isFinite(meeting.startMinutes) &&
    Number.isFinite(meeting.endMinutes) &&
    meeting.startMinutes >= 0 &&
    meeting.endMinutes > meeting.startMinutes &&
    meeting.endMinutes <= 1440 &&
    meeting.displayStart &&
    meeting.displayEnd
    ? `${meeting.displayStart}–${meeting.displayEnd}`
    : 'Time unavailable';
}

export function WeeklySchedule({
  model,
  onInspect,
}: {
  model: TimetableModel;
  onInspect: (course: CourseOffering) => void;
}) {
  const notPlacedHeading = useId();
  const notPlaced = model.sections.filter(
    (section) => section.status !== 'Scheduled' || section.warning,
  );
  const examSections = model.sections.filter((section) => section.exams.length > 0);
  return (
    <div className="timetable-preview">
      <Timetable model={model} onInspect={onInspect} />
      {notPlaced.length > 0 && (
        <section className="tt-unplaced" aria-labelledby={notPlacedHeading}>
          <h3 id={notPlacedHeading}>Not placed on the timetable</h3>
          <ul>
            {notPlaced.map((section) => (
              <li key={courseId(section.course)}>
                <button
                  type="button"
                  className="tt-text-inspect"
                  onClick={() => onInspect(section.course)}
                >
                  {section.course.code} {section.course.section}
                </button>
                <div>
                  <strong>{section.status}</strong>
                  {section.warning && <p>{section.warning}</p>}
                  {section.meetings.length > 0 && <p>Known meetings are shown above.</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <details className="tt-text-schedule">
        <summary>Text schedule</summary>
        <div className="tt-text-days">
          {model.days.map((day) => {
            const entries = model.entries.filter((entry) => entry.day === day);
            return (
              <section className="tt-text-day" key={day}>
                <h3>{dayNames[day] ?? day}</h3>
                {entries.length > 0 ? (
                  <ul>
                    {entries.map(({ id, course, meeting, conflict }) => (
                      <li key={id}>
                        <button
                          type="button"
                          className="tt-text-inspect"
                          onClick={() => onInspect(course)}
                        >
                          {course.code} {course.section}
                        </button>
                        <p>
                          {meeting.kind ?? course.sectionType ?? 'Meeting'} · {timeRange(meeting)} ·
                          Pacific time
                        </p>
                        <p>{meeting.location ?? course.campus ?? 'Location unavailable'}</p>
                        <p>{dateRange(meeting)}</p>
                        {conflict && <p className="tt-text-conflict">Confirmed time conflict</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tt-muted">No listed teaching meetings</p>
                )}
              </section>
            );
          })}
        </div>
        {examSections.length > 0 && (
          <section className="tt-exams">
            <h3>Examination details</h3>
            <p>Published exams are separate from the recurring teaching timetable.</p>
            <ul>
              {examSections.flatMap((section) =>
                section.exams.map((meeting, index) => (
                  <li key={`${courseId(section.course)}:${index}`}>
                    <button
                      type="button"
                      className="tt-text-inspect"
                      onClick={() => onInspect(section.course)}
                    >
                      {section.course.code} {section.course.section}
                    </button>
                    <p>
                      {meeting.kind ?? 'Examination'} · {dateRange(meeting)} · {timeRange(meeting)}{' '}
                      · Pacific time
                    </p>
                    <p>{meeting.location ?? section.course.campus ?? 'Location unavailable'}</p>
                  </li>
                )),
              )}
            </ul>
          </section>
        )}
      </details>
    </div>
  );
}
