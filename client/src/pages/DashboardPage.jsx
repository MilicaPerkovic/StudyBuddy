import { Link } from 'react-router-dom';
import Status from '../components/Status.jsx';
import CourseTag from '../components/CourseTag.jsx';
import { useApi } from '../utils/useApi.js';
import { formatMinutes, relativeDays, TYPE_LABELS } from '../utils/format.js';

const DAY_NAMES = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];

function DeadlineList({ items, empty }) {
  if (items.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="list">
      {items.map((a) => (
        <li key={a.id}>
          <div>
            <strong>{a.title}</strong> <span className="muted">· {TYPE_LABELS[a.type]}</span>
            <div>
              <CourseTag name={a.course_name} color={a.course_color} />
            </div>
          </div>
          <span className={a.days_left < 0 ? 'error' : a.days_left <= 2 ? 'warn' : ''}>
            {relativeDays(a.days_left)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { data, error, loading } = useApi('/dashboard');

  return (
    <Status loading={loading} error={error}>
      {data && (
        <>
          <h2>Pregled</h2>
          <div className="stats">
            <div className="card stat">
              <span className="big">{data.open_count}</span>odprtih obveznosti
            </div>
            <div className="card stat">
              <span className="big">{data.overdue.length}</span>zamujenih
            </div>
            <div className="card stat">
              <span className="big">{formatMinutes(data.week_minutes)}</span>učenja ta teden
            </div>
            <div className="card stat">
              <span className="big">{data.course_count}</span>predmetov
            </div>
          </div>

          <div className="grid2">
            <section className="card">
              <h3>Prihajajoči roki</h3>
              <DeadlineList items={data.upcoming} empty="Ni prihajajočih rokov 🎉" />
              <Link to="/assignments">Vse obveznosti →</Link>
            </section>
            <section className="card">
              <h3>Zamujeno</h3>
              <DeadlineList items={data.overdue} empty="Nič ni zamujeno." />
            </section>
          </div>

          <section className="card">
            <h3>Učenje ta teden</h3>
            <WeekChart days={data.week.per_day} />
          </section>
        </>
      )}
    </Status>
  );
}

function WeekChart({ days }) {
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return (
    <div className="chart" aria-label="Minute učenja po dnevih">
      {days.map((d, i) => (
        <div key={d.date} className="bar-col" title={`${d.date}: ${formatMinutes(d.minutes)}`}>
          <span className="bar-value">{d.minutes || ''}</span>
          <div className="bar" style={{ height: `${(d.minutes / max) * 100}%` }} />
          <span className="bar-label">{DAY_NAMES[i]}</span>
        </div>
      ))}
    </div>
  );
}
