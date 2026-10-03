import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowUpRight, Plus, Check, X, TriangleAlert } from 'lucide-react';
import { loadCourses } from '../course/courseSearch';
import {
  courseId,
  terms,
  departments,
  type CourseOffering,
  type CourseDataset,
} from '../course/courseTypes';
import {
  comparisonRows,
  courseToResource,
  prerequisiteLabel,
  scheduleLabel,
  seatsLabel,
} from '../course/comparison';
import { findConflicts } from '../course/conflictDetection';
import { usePosterBasket } from '../store/posterBasketStore';
import { Modal } from '../components/ui/Modal';
export default function Courses() {
  const [term, setTerm] = useState('2027-spring'),
    [department, setDepartment] = useState('ENGL'),
    [dataset, setDataset] = useState<CourseDataset>(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [selected, setSelected] = useState<CourseOffering[]>([]),
    [detail, setDetail] = useState<CourseOffering | null>(null);
  const request = useRef<AbortController | null>(null);
  const basket = usePosterBasket();
  const conflicts = findConflicts(selected);
  const search = useCallback(async (nextTerm: string, nextDepartment: string) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    setDataset(undefined);
    try {
      const data = await loadCourses(nextTerm, nextDepartment, controller.signal);
      if (!controller.signal.aborted) setDataset(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'Unable to load courses.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void search('2027-spring', 'ENGL');
    return () => request.current?.abort();
  }, [search]);
  function toggle(c: CourseOffering) {
    setSelected((old) =>
      old.some((x) => courseId(x) === courseId(c))
        ? old.filter((x) => courseId(x) !== courseId(c))
        : [...old, c],
    );
  }
  const add = (c: CourseOffering) => basket.add(courseToResource(c));
  return (
    <>
      <header className="page-heading">
        <div className="eyebrow">03 / EXPLORE</div>
        <h1>SFU Course Planner</h1>
        <p>Explore course offerings and identify timetable conflicts.</p>
      </header>
      <div className="course-intro">
        <CalendarDays />
        <p>
          <strong>A clearer view of your options.</strong> Compare published offerings side by side.
          Keep selected courses while changing terms or departments.
        </p>
        <Link to="/poster">Poster Content ({basket.items.length}) →</Link>
      </div>
      <form
        className="course-search"
        onSubmit={(e) => {
          e.preventDefault();
          void search(term, department);
        }}
      >
        <label>
          Term
          <select value={term} onChange={(e) => setTerm(e.target.value)}>
            {Object.entries(terms).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Department
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <button className="primary" type="submit" disabled={loading}>
          Search Courses
        </button>
      </form>
      <p className="notice">
        Curated snapshot, not live enrollment data. Only a small subset of published offerings is
        included. Missing data is shown as unavailable. Confirm all required lectures, tutorials and
        labs in the official outline and goSFU.
      </p>
      {loading && <p role="status">Loading course offerings…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void search(term, department)}>Retry</button>
        </p>
      )}
      {dataset && (
        <>
          <div className="section-heading">
            <h2>Course offerings</h2>
            <span className="muted">
              {dataset.courses.length} results · Verified {dataset.lastVerified}
            </span>
          </div>
          <div className="course-results">
            {dataset.courses.map((c) => {
              const chosen = selected.some((x) => courseId(x) === courseId(c));
              const added = basket.items.some((x) => x.id === 'course:' + courseId(c));
              return (
                <article className="course-card" key={courseId(c)}>
                  <div className="course-code">
                    <span>{c.department}</span>
                    <strong>{c.courseNumber}</strong>
                    <small>{c.section}</small>
                  </div>
                  <div className="course-content">
                    <div className="eyebrow">{c.term} · COURSE OFFERING</div>
                    <button className="course-title" onClick={() => setDetail(c)}>
                      {c.title}
                    </button>
                    <p>
                      {c.instructor || 'Instructor unavailable'} ·{' '}
                      {c.campus || 'Campus unavailable'}
                    </p>
                    <div className="schedule">
                      <CalendarDays size={16} />
                      <span>{scheduleLabel(c)}</span>
                    </div>
                    <p className="muted">Seats: {seatsLabel(c.seatsAvailable, c.seatsTotal)}</p>
                  </div>
                  <div className="course-actions">
                    <button onClick={() => toggle(c)} className={chosen ? 'added' : ''}>
                      {chosen ? <Check size={16} /> : <Plus size={16} />}{' '}
                      {chosen ? 'In Comparison' : 'Add to Comparison'}
                    </button>
                    <button onClick={() => add(c)} disabled={added}>
                      {added ? 'Added to Poster' : 'Add to Poster'}
                    </button>
                    <button onClick={() => setDetail(c)}>View Details ↗</button>
                  </div>
                </article>
              );
            })}
          </div>
          {dataset.courses.length === 0 && (
            <div className="empty-state">No verified offerings in this dataset.</div>
          )}
        </>
      )}
      <section className="comparison-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">SIDE BY SIDE</div>
            <h2>Course comparison ({selected.length})</h2>
          </div>
          {selected.length > 0 && (
            <div className="actions">
              <button onClick={() => selected.forEach(add)}>Add Comparison to Poster</button>
              <button onClick={() => setSelected([])}>Clear comparison</button>
            </div>
          )}
        </div>
        {selected.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>A little perspective helps.</h3>
            <p>Add courses from any available term to start a comparison.</p>
          </div>
        ) : (
          <>
            {conflicts.length > 0 ? (
              <div className="conflict-banner" role="status">
                <TriangleAlert />
                <div>
                  <strong>Schedule Conflict</strong>
                  {conflicts.map(({ a, b }) => (
                    <p key={courseId(a) + courseId(b)}>
                      {a.code} {a.section} and {b.code} {b.section} · {a.term}
                    </p>
                  ))}
                </div>
              </div>
            ) : selected.length > 1 ? (
              <p className="notice">
                No overlaps found in the available meeting data. This does not confirm a complete,
                conflict-free registration schedule.
              </p>
            ) : null}
            {selected.some((c) => !c.meetings.length) && (
              <p className="notice">
                Some schedules are unavailable; conflicts cannot be fully checked.
              </p>
            )}
            <div className="table-scroll comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Compare offerings</th>
                    {selected.map((c) => (
                      <th key={courseId(c)}>
                        <strong>{c.code}</strong>
                        <br />
                        {c.title}
                        <button
                          aria-label={`Remove ${c.code} ${c.term} from comparison`}
                          onClick={() => toggle(c)}
                        >
                          <X size={14} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows(selected).map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {row.values.map((value, i) => (
                        <td key={courseId(selected[i])}>{value}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Official source</th>
                    {selected.map((c) => (
                      <td key={courseId(c)}>
                        <a href={c.outlineUrl} target="_blank" rel="noreferrer">
                          Course outline ↗
                        </a>
                        <br />
                        <small>Verified {c.lastUpdated ?? 'Unavailable'}</small>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="muted">
              Previous offerings may help illustrate course demand. Enrollment patterns can differ
              between terms.
            </p>
          </>
        )}
      </section>
      {detail && (
        <Modal title={`${detail.code} · ${detail.title}`} onClose={() => setDetail(null)}>
          <span className="badge">COURSE OFFERING · {detail.term}</span>
          <dl className="fact-list">
            <div>
              <dt>Section</dt>
              <dd>{detail.section}</dd>
            </div>
            <div>
              <dt>Instructor</dt>
              <dd>{detail.instructor || 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Schedule</dt>
              <dd className="preserve-lines">{scheduleLabel(detail)}</dd>
            </div>
            <div>
              <dt>Campus</dt>
              <dd>{detail.campus || 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Course requirement — prerequisites</dt>
              <dd>{prerequisiteLabel(detail)}</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>{seatsLabel(detail.seatsAvailable, detail.seatsTotal)}</dd>
            </div>
            <div>
              <dt>Waitlist</dt>
              <dd>{seatsLabel(detail.waitlistAvailable, detail.waitlistTotal)}</dd>
            </div>
          </dl>
          <p>Last updated: {detail.lastUpdated ?? 'Unavailable'}</p>
          <a href={detail.outlineUrl} target="_blank" rel="noreferrer">
            Official Course Outline <ArrowUpRight size={15} />
          </a>
          <div className="actions">
            <button onClick={() => toggle(detail)}>
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
