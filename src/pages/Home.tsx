import { Link } from 'react-router-dom';
import { resources } from '../data/resources';
import {
  occurrenceLocationLabel,
  occurrenceTimeLabel,
  thisWeekItems,
} from '../utils/resourceOccurrences';
import '../components/resource/resourcePrograms.css';
export default function Home({ now = new Date() }: { now?: Date }) {
  const week = thisWeekItems(resources, now, 6);
  return (
    <>
      <section className="hero">
        <h1>SFU Peer Mentor Hub</h1>
        <p>Resources, posters, and course planning for SFU Peer Mentors.</p>
        <div className="actions">
          <Link className="button primary" to="/resources">
            Search Resources
          </Link>
          <Link className="button" to="/poster">
            Create Poster
          </Link>
          <Link className="button" to="/course-planner">
            Course Planner
          </Link>
        </div>
      </section>
      <section className="this-week" aria-labelledby="this-week-heading">
        <div className="section-heading">
          <h2 id="this-week-heading">This week at SFU</h2>
          <Link to="/resources?category=workshops-events">View all workshops →</Link>
        </div>
        {week.length ? (
          <ul className="this-week-list">
            {week.map(({ resource, occurrence, date, label }, index) => (
              <li key={`${resource.id}-${occurrence?.id ?? date}-${index}`}>
                <time dateTime={date}>
                  {new Intl.DateTimeFormat('en-CA', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  }).format(new Date(`${date}T12:00:00Z`))}
                </time>
                <Link
                  to={`/resources?category=${encodeURIComponent(resource.category)}&resource=${encodeURIComponent(resource.id)}`}
                >
                  {resource.title}
                  {label && <span className="this-week-date-label"> · {label}</span>}
                </Link>
                {occurrence && (
                  <>
                    <span className="this-week-time">{occurrenceTimeLabel(occurrence)}</span>
                    <span className="this-week-location">
                      {occurrenceLocationLabel(occurrence)}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="this-week-empty">
            No confirmed events or date reminders in the next seven days.
          </p>
        )}
      </section>
    </>
  );
}
