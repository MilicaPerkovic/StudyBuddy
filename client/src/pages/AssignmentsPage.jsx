import { useState } from 'react';
import Status from '../components/Status.jsx';
import CourseSelect from '../components/CourseSelect.jsx';
import CourseTag from '../components/CourseTag.jsx';
import { api, errorMessage } from '../utils/api.js';
import { useApi } from '../utils/useApi.js';
import { formatDate, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from '../utils/format.js';

const blank = (courseId) => ({
  course_id: courseId ?? null,
  title: '',
  type: 'assignment',
  due_date: '',
  priority: 'medium',
  description: '',
});

export default function AssignmentsPage() {
  const { data: courses } = useApi('/courses');
  const [filter, setFilter] = useState({ status: '', course_id: null });
  const query = new URLSearchParams();
  if (filter.status) query.set('status', filter.status);
  if (filter.course_id) query.set('course_id', filter.course_id);
  const { data: items, error, loading, reload } = useApi(`/assignments?${query}`);

  const [form, setForm] = useState(blank());
  const [formError, setFormError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api('/assignments', {
        method: 'POST',
        body: {
          ...form,
          course_id: form.course_id ?? courses?.[0]?.id,
          due_date: new Date(form.due_date).toISOString(),
        },
      });
      setForm(blank(form.course_id));
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const setStatus = async (a, status) => {
    await api(`/assignments/${a.id}/status`, { method: 'PATCH', body: { status } });
    reload();
  };

  const remove = async (a) => {
    if (!confirm(`Izbrišem "${a.title}"?`)) return;
    await api(`/assignments/${a.id}`, { method: 'DELETE' });
    reload();
  };

  if (courses?.length === 0) {
    return <p className="muted">Najprej dodaj predmet na strani Predmeti.</p>;
  }

  return (
    <>
      <h2>Obveznosti</h2>
      {courses && (
        <form className="card form-row" onSubmit={submit}>
          <input
            placeholder="Naslov"
            value={form.title}
            onChange={set('title')}
            required
            aria-label="Naslov"
          />
          <CourseSelect
            courses={courses}
            value={form.course_id ?? courses[0]?.id}
            onChange={(v) => setForm({ ...form, course_id: v })}
            aria-label="Predmet"
          />
          <select value={form.type} onChange={set('type')} aria-label="Vrsta">
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select value={form.priority} onChange={set('priority')} aria-label="Prioriteta">
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={form.due_date}
            onChange={set('due_date')}
            required
            aria-label="Rok"
          />
          <button type="submit">Dodaj</button>
          {formError && (
            <p className="error full" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}

      <div className="filters">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          aria-label="Filter stanja"
        >
          <option value="">Vsa stanja</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {courses && (
          <CourseSelect
            courses={courses}
            value={filter.course_id}
            onChange={(v) => setFilter({ ...filter, course_id: v })}
            allowEmpty
            emptyLabel="Vsi predmeti"
            aria-label="Filter predmeta"
          />
        )}
      </div>

      <Status loading={loading} error={error}>
        {items?.length === 0 && <p className="muted">Ni obveznosti.</p>}
        <table className="table">
          <tbody>
            {items?.map((a) => {
              const overdue = a.status !== 'done' && new Date(a.due_date) < new Date();
              return (
                <tr key={a.id} className={a.status === 'done' ? 'done' : ''}>
                  <td>
                    <strong>{a.title}</strong>
                    <div className="muted">
                      {TYPE_LABELS[a.type]} · prioriteta {PRIORITY_LABELS[a.priority].toLowerCase()}
                    </div>
                  </td>
                  <td>
                    <CourseTag name={a.course_name} color={a.course_color} />
                  </td>
                  <td className={overdue ? 'error' : ''}>{formatDate(a.due_date)}</td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a, e.target.value)}
                      aria-label={`Stanje ${a.title}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="danger" onClick={() => remove(a)}>
                      Izbriši
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Status>
    </>
  );
}
