import { useState } from 'react';
import { Search } from 'lucide-react';
import { resources } from '../data/resources';
import { categories } from '../data/resources/types';
import { filteredScheduleResource } from '../utils/resourceSchedule';
import { usePosterBasket } from '../store/posterBasketStore';
import { searchResources } from '../utils/search';
import { ResourceCard } from '../components/resource/ResourceCard';
import { PosterBasket } from '../components/resource/PosterBasket';
export default function Resources() {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('All'),
    [campus, setCampus] = useState('All'),
    [audience, setAudience] = useState('All'),
    [term, setTerm] = useState('Current'),
    [sport, setSport] = useState('All'),
    [day, setDay] = useState('All');
  const results = searchResources(resources, query, category, campus, term, audience);
  const recreation = results.find((r) => r.id === 'drop-in-recreation');
  const filtered = recreation ? filteredScheduleResource(recreation, sport, day) : undefined;
  return (
    <>
      <header className="page-heading">
        <h1>SFU Resource Hub</h1>
      </header>
      <div className="hub-layout">
        <div>
          <div className="search-box">
            <Search />
            <input
              aria-label="Search SFU resources"
              placeholder="Search SFU resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="filters">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>All</option>
                {Object.entries(categories).map(([v, n]) => (
                  <option value={v} key={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campus
              <select value={campus} onChange={(e) => setCampus(e.target.value)}>
                {['All', 'Burnaby', 'Surrey', 'Vancouver', 'Online'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Audience
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                {[
                  'All',
                  'Undergraduate',
                  'Graduate',
                  'International',
                  'Exchange',
                  'Visiting',
                  'FIC',
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label>
              Term
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {['Current', 'Fall 2026', 'Spring 2027', 'All'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="result-count" role="status">
            {results.length} resources
          </p>
          {category === 'recreation' && filtered && (
            <section className="panel">
              <h2>Drop-in schedule</h2>
              <p>
                {recreation?.validFrom}–{recreation?.validUntil} · Check official closures and
                changes.
              </p>
              <div className="filters">
                <label>
                  Sport
                  <select value={sport} onChange={(e) => setSport(e.target.value)}>
                    {['All', 'Badminton', 'Basketball', 'Volleyball', 'Pickleball', 'Futsal'].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Day
                  <select value={day} onChange={(e) => setDay(e.target.value)}>
                    {['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Sport</th>
                      <th>Time</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.sessions?.map((s) => (
                      <tr key={s.day + s.sport}>
                        <td>{s.day}</td>
                        <td>{s.sport}</td>
                        <td>
                          {s.start}–{s.end}
                        </td>
                        <td>{s.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                disabled={!filtered.sessions?.length}
                onClick={() => usePosterBasket.getState().add(filtered)}
              >
                Add filtered schedule to Poster
              </button>
            </section>
          )}
          <div className="resource-grid two">
            {results.map((r) => (
              <ResourceCard resource={r} key={r.id} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="empty-state">
              <h2>No matching resources</h2>
              <button
                onClick={() => {
                  setQuery('');
                  setCategory('All');
                  setCampus('All');
                  setAudience('All');
                  setTerm('All');
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <PosterBasket />
      </div>
    </>
  );
}
