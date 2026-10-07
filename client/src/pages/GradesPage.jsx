import { useState } from 'react';
import Status from '../components/Status.jsx';
import CourseSelect from '../components/CourseSelect.jsx';
import { api, errorMessage } from '../utils/api.js';
import { useApi } from '../utils/useApi.js';

export default function GradesPage() {
  const summary = useApi('/grades/summary');
  const grades = useApi('/grades');
  const courses = summary.data?.courses ?? [];
  const [form, setForm] = useState({ course_id: null, label: '', grade: 8, weight: 50 });
  const [formError, setFormError] = useState(null);

  const reload = () => {
    summary.reload();
    grades.reload();
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api('/grades', {
        method: 'POST',
        body: {
          course_id: form.course_id ?? courses[0]?.id,
          label: form.label,
          grade: Number(form.grade),
          weight: Number(form.weight),
        },
      });
      setForm({ ...form, label: '' });
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const remove = async (g) => {
    await api(`/grades/${g.id}`, { method: 'DELETE' });
    reload();
  };

  return (
    <Status loading={summary.loading && !summary.data} error={summary.error || grades.error}>
      <h2>Ocene</h2>
      {courses.length === 0 ? (
        <p className="muted">Najprej dodaj predmet na strani Predmeti.</p>
      ) : (
        <>
          <div className="card stat">
            <span className="big">{summary.data?.overall ?? '—'}</span>skupno povprečje (uteženo z
            ECTS)
          </div>
          <form className="card form-row" onSubmit={submit}>
            <CourseSelect
              courses={courses}
              value={form.course_id ?? courses[0].id}
              onChange={(v) => setForm({ ...form, course_id: v })}
              aria-label="Predmet"
            />
            <input
              placeholder="Opis (npr. Kolokvij 1)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
              aria-label="Opis"
            />
            <label className="inline">
              Ocena
              <input
                type="number"
                min="5"
                max="10"
                step="0.5"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="sm"
              />
            </label>
            <label className="inline">
              Utež %
              <input
                type="number"
                min="1"
                max="100"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="sm"
              />
            </label>
            <button type="submit">Dodaj</button>
            {formError && (
              <p className="error full" role="alert">
                {formError}
              </p>
            )}
          </form>

          <div className="cards">
            {courses.map((c) => {
              const list = (grades.data ?? []).filter((g) => g.course_id === c.id);
              return (
                <article key={c.id} className="card course" style={{ borderTopColor: c.color }}>
                  <h3>{c.name}</h3>
                  <p>
                    Povprečje: <strong>{c.average ?? '—'}</strong>{' '}
                    <span className="muted">· {c.ects} ECTS</span>
                  </p>
                  <ul className="list">
                    {list.map((g) => (
                      <li key={g.id}>
                        <span>
                          {g.label}: <strong>{g.grade}</strong>{' '}
                          <span className="muted">({g.weight} %)</span>
                        </span>
                        <button
                          className="link"
                          onClick={() => remove(g)}
                          aria-label={`Izbriši ${g.label}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Status>
  );
}
