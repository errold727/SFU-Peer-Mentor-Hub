import { Link } from 'react-router-dom';
import { BookOpen, PenTool, CalendarDays, ArrowRight, ShieldCheck } from 'lucide-react';
import { resources } from '../data/resources';
import { thisWeekResources } from '../utils/search';
import { ResourceCard } from '../components/resource/ResourceCard';
import { MountainDivider } from '../components/ui/Motifs';
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">PEER CREATED. STUDENT FOCUSED.</div>
          <h1>
            A little guidance.
            <br />
            <em>A big difference.</em>
          </h1>
          <h2>SFU Peer Mentor Hub</h2>
          <p>
            Find accurate SFU information.
            <br />
            Create useful resources for your mentees.
          </p>
          <div className="actions">
            <Link className="button primary" to="/resources">
              Search SFU Resources <ArrowRight size={18} />
            </Link>
            <Link className="button" to="/poster">
              Create a Poster
            </Link>
          </div>
          <Link className="hero-link" to="/course-planner">
            Explore Courses ↗
          </Link>
        </div>
        <div className="hero-art">
          <span className="art-note">FIND → SELECT → CREATE</span>
          <MountainDivider />
          <div className="art-caption">
            <span>
              Made for the moments
              <br />
              that make a difference.
            </span>
            <span>
              01 /<br />
              PEER MENTOR TOOLKIT
            </span>
          </div>
        </div>
      </section>
      <section className="module-grid">
        {[
          {
            name: 'Resource Hub',
            text: 'Find deadlines, library information, recreation, safety resources, academic support and more.',
            to: '/resources',
            Icon: BookOpen,
          },
          {
            name: 'Poster Maker',
            text: 'Combine trusted SFU information into customized, editable posters.',
            to: '/poster',
            Icon: PenTool,
          },
          {
            name: 'Course Planner',
            text: 'Explore future course offerings and identify timetable conflicts.',
            to: '/course-planner',
            Icon: CalendarDays,
          },
        ].map(({ name, text, to, Icon }, i) => (
          <Link className="module-card" to={to} key={name}>
            <div className="section-heading">
              <Icon size={27} />
              <span className="muted">0{i + 1}</span>
            </div>
            <h2>{name}</h2>
            <p>{text}</p>
            <span className="module-link">
              Explore <ArrowRight size={17} />
            </span>
          </Link>
        ))}
      </section>
      <section>
        <div className="section-heading">
          <div>
            <div className="eyebrow">A GOOD PLACE TO START</div>
            <h2>This week at SFU</h2>
            <p className="muted">Upcoming dates and useful current resources, in Vancouver time.</p>
          </div>
          <Link to="/resources">All resources ↗</Link>
        </div>
        <div className="resource-grid">
          {thisWeekResources(resources).map((r) => (
            <ResourceCard resource={r} key={r.id} />
          ))}
        </div>
      </section>
      <div className="trust-bar">
        <ShieldCheck />
        <span>Helpful by design. Private by default.</span>
        <p>No accounts. No mentee database. Just tools to support your community.</p>
        <Link to="/about">Our approach ↗</Link>
      </div>
    </>
  );
}
