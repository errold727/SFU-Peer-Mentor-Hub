import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, Check, X, TriangleAlert } from 'lucide-react';
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
import { findConflicts, conflictDetails } from '../course/conflictDetection';
import { usePosterBasket } from '../store/posterBasketStore';
import { Modal } from '../components/ui/Modal';
import { WeeklySchedule } from '../course/WeeklySchedule';

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
  const [term, setTerm] = useState<TermCode>('1271'),
    [subject, setSubject] = useState('All');
  const [manifest, setManifest] = useState<CourseManifest>(),
    [dataset, setDataset] = useState<OfferingDataset>();
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<CourseOffering[]>([]),
    [detail, setDetail] = useState<CourseOffering | null>(null);
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
  const conflicts = useMemo(() => findConflicts(selected), [selected]);
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
      setSelected((old) => old.filter((x) => courseId(x) !== courseId(c)));
      return;
    }
    setBusy(courseId(c));
    setActionError('');
    try {
      const full = await complete(c);
      setSelected((old) =>
        old.some((x) => courseId(x) === courseId(full)) ? old : [...old, full],
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not select section.');
    } finally {
      setBusy('');
    }
  }
  function add(c: CourseOffering) {
    basket.add(courseToResource(c));
  }
  function addConflict(a: CourseOffering, b: CourseOffering) {
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
        ...conflictDetails(a, b),
        'Verify schedules with SFU.',
      ].join('\n'),
    });
  }
  function resetPage() {
    setPage(1);
  }
  return (
    <>
      <header className="page-heading">
        <div className="eyebrow">03 / EXPLORE</div>
        <h1>SFU Course Planner</h1>
        <p>Browse course offerings. Bring your options together.</p>
      </header>
      <div className="course-intro">
        <CalendarDays />
        <p>
          <strong>Across subjects. Side by side.</strong> Select individual sections to compare
          schedules and create a concise poster. Selections are temporary.
        </p>
        <Link to="/poster">Poster Content ({basket.items.length}) →</Link>
      </div>
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
        <button className="primary" type="submit" disabled={loading}>
          Search Courses
        </button>
      </form>
      <p className="notice">
        {term === '1271'
          ? 'Spring 2027 course offerings and schedules may change before enrolment. Verify final details through SFU.'
          : 'Fall 2026 enrollment is a snapshot, not live availability or a prediction.'}{' '}
        Confirm required lectures, tutorials and labs through official SFU sources.
      </p>
      {manifest?.termCode === term && (
        <div className="snapshot-summary">
          <p>
            <strong>
              {manifest.complete
                ? 'Complete CourSys offering index'
                : 'Incomplete CourSys snapshot'}
            </strong>{' '}
            · {manifest.subjectCount} subjects · {manifest.courseCount} course codes ·{' '}
            {manifest.sectionCount} sections
          </p>
          <p>Data snapshot: {formatSnapshot(manifest.snapshotAt)}</p>
          {!manifest.complete && (
            <p role="alert">
              Subjects needing review:{' '}
              {manifest.failedSubjects.join(', ') || 'Completeness not confirmed'}
            </p>
          )}
          <a
            href={buildCoursysBrowseUrl(term, subject === 'All' ? undefined : subject)}
            target="_blank"
            rel="noreferrer"
          >
            View {subject === 'All' ? 'this term' : subject} in CourSys ↗
          </a>
          <p className="muted">
            Source: SFU CourSys. Details enriched from SFU Course Outlines.{' '}
            {manifest.withoutSchedules} sections have no published schedule in this snapshot;{' '}
            {manifest.sectionCount - manifest.enrichedSections} have no usable outline. CourSys
            enrollment is itself updated overnight.
          </p>
        </div>
      )}
      <div className="filters course-filter-row">
        <label>
          Find a course
          <input
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
      </div>
      {loading && <p role="status">Loading course offerings…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>{' '}
          <a href={buildCoursysBrowseUrl(term)}>Official SFU CourSys ↗</a>
        </p>
      )}
      {actionError && <p role="alert">{actionError} Please retry the section action.</p>}
      {dataset && (
        <>
          <div className="section-heading">
            <h2>Course offerings</h2>
            <span role="status">
              {groups.length} courses · {results.length} matching sections
            </span>
          </div>
          <p className="muted">
            Enrollment-section filters use published outline metadata. Sections with unavailable
            types remain visible under All.
          </p>
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
                      </div>
                      <div className="course-content">
                        <button className="course-title" onClick={() => void inspect(c)}>
                          {c.title}
                        </button>
                        <p>
                          {c.instructor || 'Instructor unavailable'} ·{' '}
                          {c.campus || 'Campus unavailable'}
                          {c.deliveryMethod ? ` · ${c.deliveryMethod}` : ''}
                        </p>
                        <div className="schedule">
                          <CalendarDays size={16} />
                          <span>{scheduleLabel(c)}</span>
                        </div>
                        {c.scheduleNote && <p className="notice">{c.scheduleNote}</p>}
                        <p className="enrollment-snapshot">
                          Enrollment snapshot: <strong>{enrollmentLabel(c)}</strong>
                          {c.enrollment?.waitlistCount !== undefined &&
                            ` · Waitlist: ${c.enrollment.waitlistCount}`}
                        </p>
                        <SourceLinks course={c} />
                      </div>
                      <div className="course-actions">
                        <button
                          disabled={!!busy}
                          onClick={() => void toggle(c)}
                          className={chosen ? 'added' : ''}
                        >
                          {chosen ? <Check size={16} /> : <Plus size={16} />}{' '}
                          {chosen ? 'Selected' : 'Add to Comparison'}
                        </button>
                        <button onClick={() => add(c)} disabled={added}>
                          {added ? 'Added to Poster' : 'Add to Poster'}
                        </button>
                        <button disabled={!!busy} onClick={() => void inspect(c)}>
                          View Details ↗
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>
          {!results.length && (
            <div className="empty-state">
              No matching sections. Try another subject or clear filters.{' '}
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
            <div className="eyebrow">YOUR OPTIONS</div>
            <h2>Selected Courses ({selected.length})</h2>
          </div>
          {!!selected.length && (
            <div className="actions">
              <button onClick={() => selected.forEach(add)}>Add Selected Courses to Poster</button>
              <button onClick={() => setSelected([])}>Clear comparison</button>
            </div>
          )}
        </div>
        {!selected.length ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>A little perspective helps.</h3>
            <p>Select sections from any subject or term. Nothing is saved as a student schedule.</p>
          </div>
        ) : (
          <>
            <ul className="selected-courses">
              {selected.map((c) => (
                <li key={courseId(c)}>
                  {c.code} {c.section} · {c.term}{' '}
                  <button
                    aria-label={`Remove ${c.code} ${c.section} ${c.term} from comparison`}
                    onClick={() =>
                      setSelected((old) => old.filter((x) => courseId(x) !== courseId(c)))
                    }
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {conflicts.length ? (
              <div className="conflict-banner" role="status">
                <TriangleAlert />
                <div>
                  <strong>Schedule Conflict</strong>
                  {conflicts.map(({ a, b }) => (
                    <div key={courseId(a) + courseId(b)}>
                      <p>
                        {a.code} {a.section} and {b.code} {b.section} · {a.term}
                        <br />
                        {conflictDetails(a, b).join('; ')}
                      </p>
                      <button onClick={() => addConflict(a, b)}>
                        Add Schedule Conflict to Poster
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              selected.length > 1 && (
                <p className="notice">
                  No overlaps found in available meeting data. This does not confirm a complete,
                  conflict-free registration schedule.
                </p>
              )
            )}
            {selected.some((c) => !c.meetings.length || c.scheduleNote) && (
              <p className="notice">
                Some schedules are unavailable; conflicts cannot be fully checked.
              </p>
            )}
            <WeeklySchedule courses={selected} />
            <div
              className="table-scroll comparison-table"
              tabIndex={0}
              role="region"
              aria-label="Course comparison table, scroll horizontally"
            >
              <table>
                <thead>
                  <tr>
                    <th>Compare offerings</th>
                    {selected.map((c) => (
                      <th key={courseId(c)}>
                        {c.code} {c.section}
                        <br />
                        {c.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(selected).map((row) => (
                    <tr key={row.label}>
                      <th scope="row">
                        {row.label === 'Seats' ? 'Enrollment snapshot' : row.label}
                      </th>
                      {row.values.map((v, i) => (
                        <td key={courseId(selected[i])}>{v}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Official sources / snapshot</th>
                    {selected.map((c) => (
                      <td key={courseId(c)}>
                        <SourceLinks course={c} />
                        <small>{formatSnapshot(c.snapshotAt)}</small>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
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
            <button disabled={!!busy} onClick={() => void toggle(detail)}>
              {selected.some((c) => courseId(c) === courseId(detail))
                ? 'Remove from Comparison'
                : 'Add to Comparison'}
            </button>
            <button onClick={() => add(detail)}>Add to Poster</button>
          </div>
        </Modal>
      )}
    </>
  );
}
