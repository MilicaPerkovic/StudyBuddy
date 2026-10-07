import { useEffect, useState } from 'react';
import Status from '../components/Status.jsx';
import CourseSelect from '../components/CourseSelect.jsx';
import CourseTag from '../components/CourseTag.jsx';
import { api, errorMessage } from '../utils/api.js';
import { useApi } from '../utils/useApi.js';
import { formatDate } from '../utils/format.js';

export default function NotesPage() {
  const { data: courses } = useApi('/courses');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const {
    data: notes,
    error,
    loading,
    reload,
  } = useApi(`/notes${debounced ? `?q=${encodeURIComponent(debounced)}` : ''}`);
  const [editing, setEditing] = useState(null); // null | { id?, course_id, title, content }
  const [formError, setFormError] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const body = {
        course_id: editing.course_id ?? courses[0].id,
        title: editing.title,
        content: editing.content,
      };
      if (editing.id) await api(`/notes/${editing.id}`, { method: 'PUT', body });
      else await api('/notes', { method: 'POST', body });
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const remove = async (n) => {
    if (!confirm(`Izbrišem zapisek "${n.title}"?`)) return;
    await api(`/notes/${n.id}`, { method: 'DELETE' });
    reload();
  };

  if (courses?.length === 0)
    return <p className="muted">Najprej dodaj predmet na strani Predmeti.</p>;

  return (
    <>
      <h2>Zapiski</h2>
      <div className="filters">
        <input
          type="search"
          placeholder="Išči po zapiskih…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Iskanje"
        />
        <button onClick={() => setEditing({ course_id: null, title: '', content: '' })}>
          Nov zapisek
        </button>
      </div>

      {editing && courses && (
        <form className="card stack" onSubmit={save}>
          <input
            placeholder="Naslov"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            required
            aria-label="Naslov zapiska"
          />
          <CourseSelect
            courses={courses}
            value={editing.course_id ?? courses[0].id}
            onChange={(v) => setEditing({ ...editing, course_id: v })}
            aria-label="Predmet"
          />
          <textarea
            rows="8"
            placeholder="Vsebina"
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            aria-label="Vsebina"
          />
          {formError && (
            <p className="error" role="alert">
              {formError}
            </p>
          )}
          <div className="actions">
            <button type="submit">Shrani</button>
            <button type="button" className="secondary" onClick={() => setEditing(null)}>
              Prekliči
            </button>
          </div>
        </form>
      )}

      <Status loading={loading} error={error}>
        {notes?.length === 0 && <p className="muted">Ni zapiskov.</p>}
        <div className="cards">
          {notes?.map((n) => (
            <article key={n.id} className="card">
              <h3>{n.title}</h3>
              <CourseTag name={n.course_name} color={n.course_color} />
              <p className="note-content">{n.content}</p>
              <p className="muted">Posodobljeno {formatDate(n.updated_at)}</p>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() =>
                    setEditing({
                      id: n.id,
                      course_id: n.course_id,
                      title: n.title,
                      content: n.content,
                    })
                  }
                >
                  Uredi
                </button>
                <button className="danger" onClick={() => remove(n)}>
                  Izbriši
                </button>
              </div>
            </article>
          ))}
        </div>
      </Status>
    </>
  );
}
