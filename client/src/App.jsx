import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './utils/auth.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import StudyPage from './pages/StudyPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import GradesPage from './pages/GradesPage.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Nalaganje…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="grades" element={<GradesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
