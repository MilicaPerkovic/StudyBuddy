import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../utils/auth.jsx';

const LINKS = [
  { to: '/', label: 'Pregled', end: true },
  { to: '/courses', label: 'Predmeti' },
  { to: '/assignments', label: 'Obveznosti' },
  { to: '/study', label: 'Učenje' },
  { to: '/notes', label: 'Zapiski' },
  { to: '/grades', label: 'Ocene' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <header className="topbar">
        <span className="brand">📚 StudyBuddy</span>
        <nav>
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <span className="user">
          {user.name}
          <button className="link" onClick={logout}>
            Odjava
          </button>
        </span>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
