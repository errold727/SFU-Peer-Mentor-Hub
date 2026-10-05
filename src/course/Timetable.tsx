import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { TriangleAlert } from 'lucide-react';
import { courseId, type CourseOffering } from './courseTypes';
import type { TimetableEntry, TimetableModel } from './timetableModel';
import './timetable.css';

const mobilePixelsPerMinute = 1.2;
const axisWidth = 56;
const dayHeaderHeight = 36;
const dayNames: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};
function clockTime(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}
function entryLabel(entry: TimetableEntry) {
  const { course, meeting, day, conflict } = entry;
  return [
    `${course.code} ${course.section}`,
    meeting.kind ?? course.sectionType ?? 'Meeting',
    dayNames[day] ?? day,
    `${meeting.displayStart}–${meeting.displayEnd}`,
    meeting.location ?? course.campus ?? 'Location unavailable',
    'Pacific time',
    meeting.startDate || meeting.endDate
      ? `${meeting.startDate ?? 'Start date unavailable'}–${meeting.endDate ?? 'end date unavailable'}`
      : 'Teaching dates unavailable',
    ...(conflict ? ['Confirmed time conflict'] : []),
    'View section details',
  ].join(', ');
}

export function Timetable({
  model,
  onInspect,
}: {
  model: TimetableModel;
  onInspect: (course: CourseOffering) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const minutes = model.endMinutes - model.startMinutes;
  const hasEntries = model.entries.length > 0;
  const [height, setHeight] = useState(minutes * mobilePixelsPerMinute);
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const measure = () => {
      const fitDesktop = window.matchMedia('(min-width: 1100px)').matches;
      const next =
        fitDesktop && scroll.clientHeight > dayHeaderHeight
          ? scroll.clientHeight - dayHeaderHeight
          : minutes * mobilePixelsPerMinute;
      setHeight((previous) => (previous === next ? previous : next));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(scroll);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [minutes, hasEntries]);
  const pixelsPerMinute = height / minutes;
  const dayWidths = model.days.map((day) =>
    Math.max(
      144,
      ...model.entries.filter((entry) => entry.day === day).map((entry) => entry.laneCount * 128),
    ),
  );
  const gridStyle: CSSProperties = {
    minWidth: axisWidth + dayWidths.reduce((sum, width) => sum + width, 0),
    gridTemplateColumns: `${axisWidth}px ${dayWidths.map((width) => `minmax(${width}px, 1fr)`).join(' ')}`,
    '--tt-hour-height': `${60 * pixelsPerMinute}px`,
    '--tt-half-hour-height': `${30 * pixelsPerMinute}px`,
  } as CSSProperties;
  function jumpToDay(day: string) {
    const column = dayRefs.current[day];
    if (column && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: Math.max(0, column.offsetLeft - axisWidth),
        behavior: 'auto',
      });
    }
  }
  return (
    <div className="tt-calendar">
      <div className="tt-toolbar">
        <p className="tt-view-label">
          Recurring weekly pattern <span>Pacific time</span>
        </p>
        {model.entries.length > 0 && (
          <label className="tt-day-jump">
            Jump to day
            <select
              key={model.term}
              aria-label="Jump to timetable day"
              defaultValue={model.days[0]}
              onChange={(event) => jumpToDay(event.target.value)}
            >
              {model.days.map((day) => (
                <option key={day} value={day}>
                  {dayNames[day] ?? day}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {model.entries.length === 0 ? (
        <p className="tt-grid-empty">
          No published teaching meetings can be placed in this weekly view.
        </p>
      ) : (
        <div
          className="tt-scroll"
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label={`${model.term} weekly timetable, scroll for all days and times`}
        >
          <div className="tt-grid" style={gridStyle}>
            <div className="tt-day-header tt-axis-corner">Time</div>
            {model.days.map((day) => (
              <div
                className="tt-day-header"
                key={day}
                ref={(node) => {
                  dayRefs.current[day] = node;
                }}
              >
                {dayNames[day] ?? day}
              </div>
            ))}
            <div className="tt-time-axis" style={{ height }} aria-hidden="true">
              {Array.from(
                { length: Math.floor((model.endMinutes - model.startMinutes) / 60) + 1 },
                (_, index) => (
                  <span key={index} style={{ top: index * 60 * pixelsPerMinute }}>
                    {clockTime(model.startMinutes + index * 60)}
                  </span>
                ),
              )}
            </div>
            {model.days.map((day) => (
              <div
                className="tt-day-track"
                data-testid="timetable-day-track"
                data-day={day}
                key={day}
                style={{ height }}
              >
                {model.entries
                  .filter((entry) => entry.day === day)
                  .map((entry) => {
                    const { course, meeting, lane, laneCount, conflict } = entry;
                    const blockHeight =
                      (meeting.endMinutes - meeting.startMinutes) * pixelsPerMinute;
                    const compact = blockHeight < 38;
                    const label = entryLabel(entry);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        draggable={false}
                        className={`tt-meeting tt-color-${entry.colorIndex}${compact ? ' tt-meeting-short' : ''}${blockHeight < 22 ? ' tt-meeting-tiny' : ''}${conflict ? ' tt-meeting-conflict' : ''}`}
                        data-testid="timetable-meeting"
                        data-course-id={courseId(course)}
                        data-day={day}
                        data-start={meeting.startMinutes}
                        data-end={meeting.endMinutes}
                        data-lane={lane}
                        data-lane-count={laneCount}
                        data-conflict={String(conflict)}
                        style={{
                          top: (meeting.startMinutes - model.startMinutes) * pixelsPerMinute,
                          height: blockHeight,
                          left: `calc(${(lane * 100) / laneCount}% + 2px)`,
                          width: `calc(${100 / laneCount}% - 4px)`,
                        }}
                        aria-label={label}
                        title={label}
                        onClick={() => onInspect(course)}
                      >
                        <span className="tt-meeting-heading">
                          <span className="tt-meeting-code">{course.code}</span>
                          {conflict && (
                            <span className="tt-conflict-mark">
                              <TriangleAlert size={10} aria-hidden="true" /> Conflict
                            </span>
                          )}
                        </span>
                        <span className="tt-meeting-time">
                          {clockTime(meeting.startMinutes)}–{clockTime(meeting.endMinutes)}
                        </span>
                        {!compact && (
                          <span className="tt-meeting-section">
                            {course.section} · {meeting.kind ?? course.sectionType ?? 'Meeting'}
                          </span>
                        )}
                        {blockHeight >= 74 && (
                          <span className="tt-meeting-location">
                            {meeting.location ?? course.campus ?? 'Location unavailable'}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
