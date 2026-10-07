import { useState } from 'react';
import Status from '../components/Status.jsx';
import { api, errorMessage } from '../utils/api.js';
import { useApi } from '../utils/useApi.js';

const EMPTY = { name: '', code: '', ects: 6, professor: '', color: '#4f46e5' };

export default function CoursesPage() {
  const { data: courses, error, loading, reload } = useApi('/courses');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: k === 'ects' ? Number(e.target.value) : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const body = { ...form, code: form.code || null, professor: form.professor || null };
      if (editingId) await api(`/courses/${editingId}`, { method: 'PUT', body });
      else await api('/courses', { method: 'POST', body });
      setForm(EMPTY);
      setEditingId(null);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const edit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      code: c.code ?? '',
      ects: c.ects,
      professor: c.professor ?? '',
      color: c.color,
    });
  };

  const remove = async (c) => {
    if (!confirm(`Izbrišem predmet "${c.name}" in vse njegove obveznosti, zapiske in ocene?`))
      return;
    await api(`/courses/${c.id}`, { method: 'DELETE' });
    reload();
  };

  return (
    <>
      <h2>Predmeti</h2>
      <form className="card form-row" onSubmit={submit}>
        <input
          placeholder="Ime predmeta"
          value={form.name}
          onChange={set('name')}
          required
          aria-label="Ime predmeta"
        />
        <input
          placeholder="Koda"
          value={form.code}
          onChange={set('code')}
          className="sm"
          aria-label="Koda"
        />
        <input
          type="number"
          min="1"
          max="30"
          value={form.ects}
          onChange={set('ects')}
          className="sm"
          aria-label="ECTS"
        />
        <input
          placeholder="Profesor"
          value={form.professor}
          onChange={set('professor')}
          aria-label="Profesor"
        />
        <input type="color" value={form.color} onChange={set('color')} aria-label="Barva" />
        <button type="submit">{editingId ? 'Shrani' : 'Dodaj'}</button>
        {editingId && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
            }}
          >
            Prekliči
          </button>
        )}
        {formError && (
          <p className="error full" role="alert">
            {formError}
          </p>
        )}
      </form>

      <Status loading={loading} error={error}>
        {courses?.length === 0 && <p className="muted">Dodaj svoj prvi predmet.</p>}
        <div className="cards">
          {courses?.map((c) => (
            <article key={c.id} className="card course" style={{ borderTopColor: c.color }}>
              <h3>
                {c.name} {c.code && <span className="muted">({c.code})</span>}
              </h3>
              <p className="muted">
                {c.ects} ECTS{c.professor && ` · ${c.professor}`}
              </p>
              <p>
                Povprečje: <strong>{c.average ?? '—'}</strong> · Odprte obveznosti:{' '}
                <strong>{c.open_assignments}</strong>
              </p>
              <div className="actions">
                <button className="secondary" onClick={() => edit(c)}>
                  Uredi
                </button>
                <button className="danger" onClick={() => remove(c)}>
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
