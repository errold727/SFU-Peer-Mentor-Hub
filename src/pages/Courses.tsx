import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, TriangleAlert } from 'lucide-react';
import {
  loadManifest,
  loadOfferings,
  loadCourseDetail,
  filterOfferings,
  formatSnapshot,
} from '../course/courseSearch';
import {
  buildCoursysBrowseUrl,
  courseId,
  offeringTerms,
  type CourseOffering,
  type CourseManifest,
  type OfferingDataset,
  type TermCode,
} from '../course/courseTypes';
import {
  comparisonRows,
  courseToResource,
  scheduleLabel,
  enrollmentLabel,
} from '../course/comparison';
import { usePosterBasket } from '../store/posterBasketStore';
import { Modal } from '../components/ui/Modal';
import { useCoursePlanner } from '../store/coursePlannerStore';
import { buildTimetableModel } from '../course/timetableModel';
import { TimetablePreview } from '../course/TimetablePreview';
import { useRole } from '../app/access';

function SourceLinks({ course: c }: { course: CourseOffering }) {
  return (
    <span className="course-sources">
      <a href={c.courSysUrl} target="_blank" rel="noreferrer">
        CourSys ↗
      </a>
      {c.outlineUrl ? (
        <a href={c.outlineUrl} target="_blank" rel="noreferrer">
          Course Outline ↗
        </a>
      ) : (
        <span className="muted">Course outline not yet available</span>
      )}
    </span>
  );
}
export default function Courses() {
  const mentor = useRole().role === 'mentor';
  const [term, setTerm] = useState<TermCode>('1271'),
    [subject, setSubject] = useState('All');
  const [manifest, setManifest] = useState<CourseManifest>(),
    [dataset, setDataset] = useState<OfferingDataset>();
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const { selected, addSelectedSection, removeSelectedSection, clearSelectedSectionsForTerm } =
    useCoursePlanner();
  const [detail, setDetail] = useState<CourseOffering | null>(null);
  const [comparisonPage, setComparisonPage] = useState(0);
  const [clearPending, setClearPending] = useState(false);
  const [busy, setBusy] = useState(''),
    [actionError, setActionError] = useState('');
  const [query, setQuery] = useState(''),
    [campus, setCampus] = useState('All'),
    [sectionType, setSectionType] = useState('All'),
    [sort, setSort] = useState('code'),
    [page, setPage] = useState(1);
  const basket = usePosterBasket();
  const detailRequest = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setDataset(undefined);
    setPage(1);
    (async () => {
      try {
        const m = await loadManifest(term, controller.signal);
        if (controller.signal.aborted) return;
        setManifest(m);
        const chosen =
          subject === 'All' || m.subjects.some((s) => s.code === subject) ? subject : 'All';
        if (chosen !== subject) {
          setSubject(chosen);
          return;
        }
        const data = await loadOfferings(m, chosen, controller.signal);
        if (!controller.signal.aborted) setDataset(data);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof TypeError
              ? 'Connection unavailable. Retry or open official SFU CourSys.'
              : e instanceof Error
                ? e.message
                : 'Course data unavailable.',
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [term, subject, retry]);
  const results = useMemo(
    () => filterOfferings(dataset?.courses ?? [], { query, campus, sectionType, sort }),
    [dataset, query, campus, sectionType, sort],
  );
  const groups = useMemo(() => {
    const map = new Map<string, CourseOffering[]>();
    for (const c of results) map.set(c.code, [...(map.get(c.code) ?? []), c]);
    return [...map.entries()];
  }, [results]);
  const timetableModels = useMemo(
    () =>
      new Map(
        [...new Set(selected.map((course) => course.term))].map((label) => [
          label,
          buildTimetableModel(selected.filter((course) => course.term === label)),
        ]),
      ),
    [selected],
  );
  const conflicts = [...timetableModels.values()].flatMap((model) => model.conflicts);
  const comparisonPages = Math.max(1, Math.ceil(selected.length / 4));
  const activeComparisonPage = Math.min(comparisonPage, comparisonPages - 1);
  const compared = selected.slice(activeComparisonPage * 4, activeComparisonPage * 4 + 4);
  const browsedTerm = offeringTerms[term].label;
  async function complete(c: CourseOffering) {
    if (!manifest || manifest.termCode !== c.termCode)
      throw Error('Reload this term to inspect its details.');
    return loadCourseDetail(c, manifest);
  }
  async function inspect(c: CourseOffering) {
    const request = ++detailRequest.current;
    setBusy(courseId(c));
    setActionError('');
    try {
      const full = await complete(c);
      if (request === detailRequest.current) setDetail(full);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not load detail.');
    } finally {
      setBusy('');
    }
  }
  async function toggle(c: CourseOffering) {
    if (selected.some((x) => courseId(x) === courseId(c))) {
      removeSelectedSection(courseId(c));
      return;
    }
    setBusy(courseId(c));
    setActionError('');
    const revision = useCoursePlanner.getState().selectionRevision[c.term] ?? 0;
    try {
      const full = await complete(c);
      addSelectedSection(full, revision);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not select section.');
    } finally {
      setBusy('');
    }
  }
  function add(c: CourseOffering) {
    if (!mentor) return;
    basket.add(courseToResource(c));
  }
  function addConflict(a: CourseOffering, b: CourseOffering, details: string[]) {
    if (!mentor) return;
    const resource = courseToResource(a);
    basket.add({
      ...resource,
      id: `conflict:${courseId(a)}:${courseId(b)}`,
      title: `Schedule conflict · ${a.term}`,
      summary: `${a.code} ${a.section} / ${b.code} ${b.section}`,
      posterContent: [
        a.term.toUpperCase(),
        'SCHEDULE CONFLICT',
        `${a.code} ${a.section} + ${b.code} ${b.section}`,
        ...details,
        'Verify schedules with SFU.',
      ].join('\n'),
    });
  }
  function resetPage() {
    setPage(1);
  }
  return (
    <div className={selected.length ? 'course-planner-with-selections' : undefined}>
      <header className="page-heading course-heading">
        <h1>SFU Course Planner</h1>
        {mentor && <Link to="/poster">Poster Content ({basket.items.length}) →</Link>}
      </header>
      <form
        className="course-search"
        onSubmit={(e) => {
          e.preventDefault();
          setRetry((n) => n + 1);
        }}
      >
        <label>
          Term
          <select
            value={term}
            onChange={(e) => {
              if (e.target.value === term) return;
              detailRequest.current++;
              setTerm(e.target.value as TermCode);
              setClearPending(false);
              setManifest(undefined);
              setSubject('All');
              resetPage();
            }}
          >
            {Object.entries(offeringTerms).map(([code, t]) => (
              <option key={code} value={code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              resetPage();
            }}
          >
            <option value="All">All Subjects</option>
            {manifest?.termCode === term &&
              manifest.subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} ({s.sectionCount})
                </option>
              ))}
          </select>
        </label>
        <label>
          Find a course
          <input
            id="course-search-input"
            value={query}
            placeholder="Code, title, instructor, section or campus"
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
          />
        </label>
        <label>
          Campus
          <select
            value={campus}
            onChange={(e) => {
              setCampus(e.target.value);
              resetPage();
            }}
          >
            {['All', 'Burnaby', 'Surrey', 'Vancouver', 'Online', 'Other'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Sections
          <select
            value={sectionType}
            onChange={(e) => {
              setSectionType(e.target.value);
              resetPage();
            }}
          >
            {[
              ['All', 'All'],
              ['Enrollment', 'Enrollment Sections'],
              ['LEC', 'Lecture'],
              ['TUT', 'Tutorial'],
              ['LAB', 'Lab'],
              ['SEM', 'Seminar'],
              ['Other', 'Other / unavailable'],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort by
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              resetPage();
            }}
          >
            <option value="code">Course code</option>
            <option value="title">Title</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          Search Courses
        </button>
      </form>
      <p className="course-caveat">
        {term === '1271'
          ? 'Spring 2027 course offerings and schedules may change before enrolment. Verify final details through SFU.'
          : 'Fall 2026 enrollment is a snapshot, not live availability or a prediction.'}
      </p>
      {manifest?.termCode === term && (
        <div className="snapshot-summary">
          <span>Snapshot: {formatSnapshot(manifest.snapshotAt)}</span>
          <a
            href={buildCoursysBrowseUrl(term, subject === 'All' ? undefined : subject)}
            target="_blank"
            rel="noreferrer"
          >
            View {subject === 'All' ? 'this term' : subject} in CourSys ↗
          </a>
          <details className="coverage-details" open={!manifest.complete}>
            <summary>{manifest.complete ? 'Coverage & sources' : 'Incomplete snapshot'}</summary>
            <p>
              <strong>
                {manifest.complete
                  ? 'Complete CourSys offering index'
                  : 'Incomplete CourSys snapshot'}
              </strong>{' '}
              · {manifest.subjectCount} subjects · {manifest.courseCount} course codes ·{' '}
              {manifest.sectionCount} sections
            </p>
            {!manifest.complete && (
              <p role="alert">
                Subjects needing review:{' '}
                {manifest.failedSubjects.join(', ') || 'Completeness not confirmed'}
              </p>
            )}
            <p>
              Source: SFU CourSys; details from SFU Course Outlines. {manifest.withoutSchedules}{' '}
              sections have no published schedule;{' '}
              {manifest.sectionCount - manifest.enrichedSections} have no usable outline. CourSys
              enrollment updates overnight.
            </p>
            <p>
              Confirm required lectures, tutorials and labs with SFU. Enrollment-section filters use
              published outline metadata; unavailable types remain under All. Selections are
              temporary.
            </p>
          </details>
        </div>
      )}
      {loading && <p role="status">Loading course offerings…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>{' '}
          <a href={buildCoursysBrowseUrl(term)}>Official SFU CourSys ↗</a>
        </p>
      )}
      {actionError && <p role="alert">{actionError} Please retry the section action.</p>}
      {!!busy && <p role="status">Loading section details…</p>}
      {dataset && (
        <>
          <div className="section-heading results-heading">
            <h2>Course offerings</h2>
            <span role="status">
              {groups.length} courses · {results.length} matching sections
            </span>
          </div>
          <div className="course-results">
            {groups.slice((page - 1) * 12, page * 12).map(([code, courses]) => (
              <section className="course-group" key={code} aria-label={code}>
                <h3>
                  {code} <span>{courses[0].title}</span>
                </h3>
                {courses.map((c) => {
                  const chosen = selected.some((x) => courseId(x) === courseId(c)),
                    added = basket.items.some((x) => x.id === 'course:' + courseId(c));
                  return (
                    <article
                      className="course-card"
                      key={courseId(c)}
                      aria-label={`${c.code} ${c.section}`}
                    >
                      <div className="course-code">
                        <strong>{c.section}</strong>
                        <small>{c.sectionType ?? 'Type unavailable'}</small>
                        {conflicts.some(
                          ({ a, b }) => courseId(a) === courseId(c) || courseId(b) === courseId(c),
                        ) && <span className="row-conflict">Conflict</span>}
                      </div>
                      <div className="course-meetings">
                        {c.title !== courses[0].title && <strong>{c.title}</strong>}
                        {c.meetings.length ? (
                          c.meetings.map((m, i) => (
                            <span key={i}>
                              {m.kind && m.kind !== c.sectionType ? m.kind + ' · ' : ''}
                              {m.days.join(', ')} {m.displayStart}–{m.displayEnd}
                            </span>
                          ))
                        ) : (
                          <span>Schedule not yet published</span>
                        )}
                        {c.scheduleNote && (
                          <span className="warning">
                            Some schedule details unavailable · see Details
                          </span>
                        )}
                      </div>
                      <div className="course-person">
                        <span>{c.instructor || 'Instructor unavailable'}</span>
                        <span className="muted">
                          {c.campus || 'Campus unavailable'}
                          {c.deliveryMethod ? ' · ' + c.deliveryMethod : ''}
                        </span>
                      </div>
                      <div
                        className="enrollment-snapshot"
                        title="Enrollment snapshot at the date shown above; not live availability"
                      >
                        <span>{enrollmentLabel(c)}</span>
                        {c.enrollment?.waitlistCount !== undefined && (
                          <span>Waitlist {c.enrollment.waitlistCount}</span>
                        )}
                      </div>
                      <div className="course-actions">
                        <div className="row-actions">
                          <button
                            aria-disabled={!!busy}
                            onClick={() => {
                              if (!busy) void toggle(c);
                            }}
                            className={chosen ? 'added' : ''}
                            aria-pressed={chosen}
                          >
                            {chosen && <Check size={14} />}
                            {chosen ? 'Added' : 'Add'}
                          </button>
                          {mentor && (
                            <button className="tertiary" onClick={() => add(c)} disabled={added}>
                              {added ? 'In Poster' : 'Add to Poster'}
                            </button>
                          )}
                          <button
                            className="tertiary"
                            aria-disabled={!!busy}
                            onClick={() => {
                              if (!busy) void inspect(c);
                            }}
                          >
                            Details →
                          </button>
                        </div>
                        <SourceLinks course={c} />
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>
          {!results.length && (
            <div className="empty-state">
              No matching sections.{' '}
              <button
                onClick={() => {
                  setQuery('');
                  setCampus('All');
                  setSectionType('All');
                  setSubject('All');
                  resetPage();
                }}
              >
                Clear course filters
              </button>
            </div>
          )}
          {groups.length > 12 && (
            <nav className="actions pagination" aria-label="Course result pages">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(groups.length / 12)}
              </span>
              <button disabled={page * 12 >= groups.length} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}
      <section className="comparison-section">
        <div className="section-heading">
          <div>
            <h2>Selected sections ({selected.length})</h2>
          </div>
          {!!selected.length && (
            <div className="actions">
              {mentor && (
                <button onClick={() => selected.forEach(add)}>
                  Add Selected Courses to Poster
                </button>
              )}
              {selected.some((course) => course.term === browsedTerm) && (
                <button onClick={() => setClearPending(true)}>
                  Clear {browsedTerm} selections
                </button>
              )}
            </div>
          )}
        </div>
        {clearPending && (
          <div className="notice" role="group" aria-label="Confirm clear selections">
            <p>Remove selections for {browsedTerm}? Choices in other terms will remain.</p>
            <div className="actions">
              <button
                onClick={() => {
                  clearSelectedSectionsForTerm(browsedTerm);
                  setClearPending(false);
                }}
              >
                Confirm clear {browsedTerm}
              </button>
              <button onClick={() => setClearPending(false)}>Cancel</button>
            </div>
          </div>
        )}
        {!selected.length ? (
          <div className="empty-state">
            <p>Add sections to build your timetable. Selections are temporary.</p>
          </div>
        ) : (
          <>
            <ul className="selected-courses">
              {selected.map((c) => (
                <li key={courseId(c)}>
                  {c.code} {c.section} · {c.term}{' '}
                  <button
                    aria-label={`Remove ${c.code} ${c.section} ${c.term} from selections`}
                    onClick={() => removeSelectedSection(courseId(c))}
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {conflicts.length ? (
              <div className="conflict-banner">
                <TriangleAlert />
                <div>
                  <strong>Schedule Conflict</strong>
                  {conflicts.slice(0, 3).map(({ a, b, details }) => (
                    <div key={courseId(a) + courseId(b)}>
                      <p>
                        {a.code} {a.section} and {b.code} {b.section} · {a.term}
                        <br />
                        {details.join('; ')}
                      </p>
                      {mentor && (
                        <button onClick={() => addConflict(a, b, details)}>
                          Add Schedule Conflict to Poster
                        </button>
                      )}
                    </div>
                  ))}
                  {conflicts.length > 3 && (
                    <p>
                      {conflicts.length - 3} more conflicting pairs. Open View Timetable to inspect
                      each term.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              selected.length > 1 &&
              [...timetableModels.values()].every((model) => !model.incomplete) && (
                <p className="notice">
                  No published overlaps. Confirm your complete registration schedule with SFU.
                </p>
              )
            )}
            {[...timetableModels.values()].some((model) => model.incomplete) && (
              <p className="notice">
                Some schedules are unavailable; conflicts cannot be fully checked.
              </p>
            )}
            <details>
              <summary>Offering details</summary>
              {comparisonPages > 1 && (
                <div className="comparison-detail-controls">
                  <button
                    disabled={activeComparisonPage === 0}
                    onClick={() => setComparisonPage(activeComparisonPage - 1)}
                  >
                    Previous sections
                  </button>
                  <span>
                    Sections {activeComparisonPage * 4 + 1}–
                    {Math.min(selected.length, activeComparisonPage * 4 + 4)} of {selected.length}
                  </span>
                  <button
                    disabled={activeComparisonPage >= comparisonPages - 1}
                    onClick={() => setComparisonPage(activeComparisonPage + 1)}
                  >
                    Next sections
                  </button>
                </div>
              )}
              <div
                className="table-scroll comparison-table"
                tabIndex={0}
                role="region"
                aria-label="Selected offering details, scroll horizontally"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Selected offerings</th>
                      {compared.map((c) => (
                        <th key={courseId(c)}>
                          {c.code} {c.section}
                          <br />
                          {c.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows(compared).map((row) => (
                      <tr key={row.label}>
                        <th scope="row">
                          {row.label === 'Seats' ? 'Enrollment snapshot' : row.label}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={courseId(compared[i])}>{v}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">Official sources / snapshot</th>
                      {compared.map((c) => (
                        <td key={courseId(c)}>
                          <SourceLinks course={c} />
                          <small>{formatSnapshot(c.snapshotAt)}</small>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </details>
            <p className="muted">
              Times use America/Vancouver. Adjacent classes do not overlap; allow your own travel
              time.
            </p>
          </>
        )}
      </section>
      {detail && (
        <Modal
          variant="drawer"
          title={`${detail.code} · ${detail.title}`}
          onClose={() => {
            detailRequest.current++;
            setDetail(null);
          }}
        >
          <span className="badge">
            {detail.term} · {detail.section}
          </span>
          <dl className="fact-list">
            {[
              ['Instructor', detail.instructor],
              ['Units', detail.units],
              ['Section type', detail.sectionType],
              ['Campus', detail.campus],
              ['Delivery method', detail.deliveryMethod],
              ['Schedule', scheduleLabel(detail)],
              ['Schedule note', detail.scheduleNote],
              ['Course requirement — prerequisites', detail.prerequisiteText],
              ['Corequisites', detail.corequisites],
              ['WQB designation', detail.designation],
              ['Enrollment snapshot', detail.enrollment ? enrollmentLabel(detail) : undefined],
              ['Waitlist snapshot', detail.enrollment?.waitlistCount?.toString()],
              ['Crosslisted with', detail.crosslistedWith?.join('; ')],
              ['Class number', detail.classNumber],
              ['Official description', detail.description],
              ['Registrar notes', detail.registrarNotes],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="preserve-lines">{value}</dd>
                </div>
              ))}
          </dl>
          {!detail.prerequisiteText && <p>Prerequisite information unavailable.</p>}
          <p>CourSys snapshot: {formatSnapshot(detail.snapshotAt)}</p>
          {detail.outlineRetrievedAt && (
            <p>Outline retrieved: {formatSnapshot(detail.outlineRetrievedAt)}</p>
          )}
          <SourceLinks course={detail} />
          <div className="actions">
            <button
              aria-disabled={!!busy}
              aria-pressed={selected.some((c) => courseId(c) === courseId(detail))}
              onClick={() => {
                if (!busy) void toggle(detail);
              }}
            >
              {selected.some((c) => courseId(c) === courseId(detail)) ? 'Added' : 'Add'}
            </button>
            {mentor && <button onClick={() => add(detail)}>Add to Poster</button>}
          </div>
        </Modal>
      )}
      <TimetablePreview
        models={timetableModels}
        browsedTerm={browsedTerm}
        onOpen={() => {
          detailRequest.current++;
          setDetail(null);
        }}
      />
    </div>
  );
}
