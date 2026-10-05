import { useRef, useState } from 'react';
import { CalendarDays, TriangleAlert, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { courseId, type CourseOffering } from './courseTypes';
import { WeeklySchedule, WeeklyScheduleDetails } from './WeeklySchedule';
import { buildTimetableModel, type TimetableModel } from './timetableModel';
import { defaultTimetableTerm, useCoursePlanner } from '../store/coursePlannerStore';
import './TimetablePreview.css';

export function TimetablePreview({
  models,
  browsedTerm,
  onOpen,
}: {
  models: Map<string, TimetableModel>;
  browsedTerm: string;
  onOpen: () => void;
}) {
  const { selected, mostRecentTerm } = useCoursePlanner();
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const defaultTerm = defaultTimetableTerm(selected, browsedTerm, mostRecentTerm);
  const model = models.get(defaultTerm);
  return (
    <>
      {!!selected.length && openTerm === null && (
        <button
          id="timetable-launcher"
          className="timetable-launcher"
          aria-haspopup="dialog"
          onClick={() => {
            onOpen();
            setOpenTerm(defaultTerm);
          }}
        >
          <CalendarDays size={21} aria-hidden="true" />
          <span>
            <strong>
              View Timetable <span className="timetable-count">{selected.length}</span>
            </strong>
            <small>
              {models.size > 1
                ? `${selected.length} sections · ${models.size} terms`
                : `${defaultTerm}${model?.conflicts.length ? ` · ${model.conflicts.length} conflict${model.conflicts.length === 1 ? '' : 's'}` : model?.incomplete ? ' · Incomplete schedules' : ''}`}
            </small>
          </span>
        </button>
      )}
      {openTerm !== null && (
        <TimetableDialog initialTerm={openTerm} models={models} onClose={() => setOpenTerm(null)} />
      )}
    </>
  );
}

function TimetableDialog({
  initialTerm,
  models,
  onClose,
}: {
  initialTerm: string;
  models: Map<string, TimetableModel>;
  onClose: () => void;
}) {
  const { removeSelectedSection, clearSelectedSectionsForTerm } = useCoursePlanner();
  const [term, setTerm] = useState(initialTerm);
  const [clearPending, setClearPending] = useState(false);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [panelOpen, setPanelOpen] = useState(
    () => window.matchMedia('(min-width: 1100px)').matches,
  );
  const panelHeading = useRef<HTMLElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailOpener = useRef<HTMLElement | null>(null);
  const emptyAction = useRef<HTMLButtonElement>(null);
  const clearAction = useRef<HTMLButtonElement>(null);
  const model = models.get(term) ?? buildTimetableModel([]);
  const terms = [...new Set([...models.keys(), term])];
  const inspected = model.sections.find(({ course }) => courseId(course) === inspectedId);
  function inspect(course: CourseOffering) {
    detailOpener.current = document.activeElement as HTMLElement | null;
    setInspectedId(courseId(course));
    requestAnimationFrame(() => detailHeading.current?.focus());
  }
  function remove(course: CourseOffering) {
    removeSelectedSection(courseId(course));
    setInspectedId(null);
    setClearPending(false);
    setAnnouncement(`${course.code} ${course.section} removed from ${term}.`);
    requestAnimationFrame(() => (emptyAction.current ?? panelHeading.current)?.focus());
  }
  const alternativeCodes = [...new Set(model.sections.map(({ course }) => course.code))].filter(
    (code) => model.sections.filter(({ course }) => course.code === code).length > 1,
  );
  const conflictingIds = new Set(model.conflicts.flatMap(({ a, b }) => [courseId(a), courseId(b)]));

  return (
    <Modal
      title="My Timetable"
      variant="timetable"
      onClose={onClose}
      returnFocus={() =>
        document.getElementById('timetable-launcher') ??
        document.getElementById('course-search-input')
      }
    >
      <div className="timetable-toolbar">
        {terms.length > 1 ? (
          <label>
            Timetable term
            <select
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setClearPending(false);
                setInspectedId(null);
                setAnnouncement('');
              }}
            >
              {terms.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ) : (
          <strong>{term}</strong>
        )}
        <span>
          {model.sections.length} selected section{model.sections.length === 1 ? '' : 's'}
        </span>
      </div>
      <p className="timetable-status">
        {model.conflicts.length ? (
          <>
            <TriangleAlert size={16} aria-hidden="true" />
            {model.conflicts.length} conflicting section pair
            {model.conflicts.length === 1 ? '' : 's'} in {term}.
          </>
        ) : model.sections.length > 0 ? (
          'No detected conflicts among published meeting times.'
        ) : null}
        {model.incomplete &&
          ' Some selected schedules are unavailable; conflict checking is incomplete.'}
      </p>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      {model.sections.length === 0 ? (
        <div className="timetable-empty">
          <h3>No sections selected for {term}</h3>
          <p>Browse courses to add published sections to this timetable.</p>
          <button className="primary" ref={emptyAction} onClick={onClose}>
            Back to courses
          </button>
        </div>
      ) : (
        <div className="timetable-workspace">
          <div className="timetable-calendar-panel">
            <WeeklySchedule model={model} onInspect={inspect} showDetails={false} />
          </div>
          <aside className="timetable-side" aria-label="Selected sections and meeting details">
            {inspected && (
              <section
                className="timetable-meeting-details"
                aria-labelledby="timetable-meeting-title"
              >
                <div className="timetable-detail-heading">
                  <h3 id="timetable-meeting-title" tabIndex={-1} ref={detailHeading}>
                    {inspected.course.code} · {inspected.course.section}
                  </h3>
                  <button
                    aria-label="Close meeting details"
                    onClick={() => {
                      setInspectedId(null);
                      requestAnimationFrame(
                        () => detailOpener.current?.isConnected && detailOpener.current.focus(),
                      );
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
                <strong>{inspected.course.title}</strong>
                <p>
                  {inspected.course.sectionType ?? 'Component unavailable'} ·{' '}
                  {inspected.course.campus ?? 'Campus unavailable'}
                </p>
                <p>
                  Instructor:{' '}
                  {inspected.course.instructors?.join(', ') ||
                    inspected.course.instructor ||
                    'Unavailable'}
                </p>
                {inspected.warning && <p className="notice">{inspected.warning}</p>}
                <ul>
                  {[...inspected.meetings, ...inspected.exams].map((meeting, index) => (
                    <li key={index}>
                      <strong>
                        {meeting.kind ?? inspected.course.sectionType} · {meeting.days.join(', ')}{' '}
                        {meeting.displayStart}–{meeting.displayEnd}
                      </strong>
                      <span>{meeting.location ?? 'Room unavailable'}</span>
                      <span>
                        {meeting.startDate ?? 'Start date unavailable'} –{' '}
                        {meeting.endDate ?? 'End date unavailable'}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="course-sources">
                  {inspected.course.courSysUrl && (
                    <a href={inspected.course.courSysUrl} target="_blank" rel="noopener noreferrer">
                      CourSys ↗
                    </a>
                  )}
                  {inspected.course.outlineUrl && (
                    <a href={inspected.course.outlineUrl} target="_blank" rel="noopener noreferrer">
                      Course Outline ↗
                    </a>
                  )}
                </div>
                <button onClick={() => remove(inspected.course)}>Remove section</button>
              </section>
            )}
            <details
              className="timetable-selections"
              open={panelOpen}
              onToggle={(event) => setPanelOpen(event.currentTarget.open)}
            >
              <summary ref={panelHeading} tabIndex={0}>
                Selected sections ({model.sections.length})
              </summary>
              <button
                ref={clearAction}
                className="timetable-clear"
                onClick={() => setClearPending(true)}
              >
                Clear selections
              </button>
              {clearPending && (
                <div
                  className="timetable-clear-confirm"
                  role="group"
                  aria-label="Confirm clear selections"
                >
                  <p>
                    Remove all {model.sections.length} selections for {term}?
                  </p>
                  <div className="actions">
                    <button
                      onClick={() => {
                        clearSelectedSectionsForTerm(term);
                        setClearPending(false);
                        setInspectedId(null);
                        setAnnouncement(`All selections for ${term} cleared.`);
                        requestAnimationFrame(() => emptyAction.current?.focus());
                      }}
                    >
                      Confirm clear {term}
                    </button>
                    <button
                      onClick={() => {
                        setClearPending(false);
                        requestAnimationFrame(() => clearAction.current?.focus());
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <ul>
                {model.sections.map(({ course, status, meetings }) => (
                  <li
                    key={courseId(course)}
                    data-conflict={String(conflictingIds.has(courseId(course)))}
                  >
                    <div className="timetable-selection-heading">
                      <button className="timetable-section-name" onClick={() => inspect(course)}>
                        {course.code} · {course.section}
                        <span>{course.sectionType ?? 'Component unavailable'}</span>
                      </button>
                      {conflictingIds.has(courseId(course)) && (
                        <span className="timetable-selection-conflict">
                          <TriangleAlert size={12} aria-hidden="true" /> Conflict
                        </span>
                      )}
                    </div>
                    <p>
                      {meetings.length
                        ? meetings
                            .map(
                              (meeting) =>
                                `${meeting.days.join(', ')} ${meeting.displayStart}–${meeting.displayEnd}`,
                            )
                            .join('\n')
                        : status}
                    </p>
                    {alternativeCodes.includes(course.code) && (
                      <p className="timetable-alternative">
                        Multiple sections of this course selected.
                      </p>
                    )}
                    <button
                      aria-label={`Remove ${course.code} ${course.section} from timetable`}
                      onClick={() => remove(course)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p>
                Required lecture, tutorial and lab combinations are not verified here. Check
                official section requirements.
              </p>
            </details>
            <WeeklyScheduleDetails model={model} onInspect={inspect} />
            {!!model.conflicts.length && (
              <details className="timetable-conflict-details">
                <summary tabIndex={0}>
                  Conflict details ({model.conflicts.length}) · {term}
                </summary>
                <ul>
                  {model.conflicts.map(({ a, b, details }) => (
                    <li key={`${courseId(a)}:${courseId(b)}`}>
                      <strong>
                        {a.code} {a.section} / {b.code} {b.section}
                      </strong>
                      <span>{details.join('; ')}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </aside>
        </div>
      )}
      <p className="timetable-footer">
        Planning preview only. Confirm schedules and enrol through SFU.
      </p>
    </Modal>
  );
}
