import { Link } from 'react-router-dom';
import { resources } from '../data/resources';
import { thisWeekResources } from '../utils/search';
import { ResourceCard } from '../components/resource/ResourceCard';
export default function Home() {
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
      <section>
        <div className="section-heading">
          <h2>This week at SFU</h2>
          <Link to="/resources">All resources ↗</Link>
        </div>
        <div className="resource-grid">
          {thisWeekResources(resources).map((r) => (
            <ResourceCard resource={r} key={r.id} />
          ))}
        </div>
      </section>
    </>
  );
}
