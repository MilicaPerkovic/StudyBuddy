import { useState } from 'react';
import Status from '../components/Status.jsx';
import CourseSelect from '../components/CourseSelect.jsx';
import CourseTag from '../components/CourseTag.jsx';
import StudyTimer from '../components/StudyTimer.jsx';
import { api, errorMessage } from '../utils/api.js';
import { useApi } from '../utils/useApi.js';
import { formatDate, formatMinutes, toLocalInput } from '../utils/format.js';

export default function StudyPage() {
  const { data: courses } = useApi('/courses');
  const { data: sessions, error, loading, reload } = useApi('/sessions');
  const [courseId, setCourseId] = useState(null);
  const [manual, setManual] = useState({
    started_at: toLocalInput(new Date().toISOString()),
    duration_minutes: 30,
    note: '',
  });
  const [formError, setFormError] = useState(null);

  const save = async (startedAt, minutes, note = '') => {
    setFormError(null);
    try {
      await api('/sessions', {
        method: 'POST',
        body: { course_id: courseId, started_at: startedAt, duration_minutes: minutes, note },
      });
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const submitManual = (e) => {
    e.preventDefault();
    save(new Date(manual.started_at).toISOString(), Number(manual.duration_minutes), manual.note);
  };

  const remove = async (s) => {
    await api(`/sessions/${s.id}`, { method: 'DELETE' });
    reload();
  };

  const total = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) ?? 0;

  return (
    <>
      <h2>Učenje</h2>
      <div className="card form-row">
        <span>Predmet:</span>
        <CourseSelect
          courses={courses ?? []}
          value={courseId}
          onChange={setCourseId}
          allowEmpty
          emptyLabel="Brez predmeta"
          aria-label="Predmet"
        />
      </div>

      <div className="grid2">
        <section className="card">
          <h3>Pomodoro časovnik</h3>
          <StudyTimer onComplete={(startedAt, minutes) => save(startedAt, minutes, 'Pomodoro')} />
        </section>
        <form className="card stack" onSubmit={submitManual}>
          <h3>Ročni vnos</h3>
          <label>
            Začetek
            <input
              type="datetime-local"
              value={manual.started_at}
              onChange={(e) => setManual({ ...manual, started_at: e.target.value })}
              required
            />
          </label>
          <label>
            Trajanje (min)
            <input
              type="number"
              min="1"
              max="1440"
              value={manual.duration_minutes}
              onChange={(e) => setManual({ ...manual, duration_minutes: e.target.value })}
              required
            />
          </label>
          <label>
            Opomba
            <input
              value={manual.note}
              onChange={(e) => setManual({ ...manual, note: e.target.value })}
            />
          </label>
          <button type="submit">Shrani</button>
        </form>
      </div>
      {formError && (
        <p className="error" role="alert">
          {formError}
        </p>
      )}

      <section className="card">
        <h3>Zgodovina · skupaj {formatMinutes(total)}</h3>
        <Status loading={loading} error={error}>
          {sessions?.length === 0 && <p className="muted">Še ni zabeleženega učenja.</p>}
          <ul className="list">
            {sessions?.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{formatMinutes(s.duration_minutes)}</strong> · {formatDate(s.started_at)}{' '}
                  <CourseTag name={s.course_name} color={s.course_color} />
                  {s.note && <div className="muted">{s.note}</div>}
                </div>
                <button className="link" onClick={() => remove(s)} aria-label="Izbriši sejo">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Status>
      </section>
    </>
  );
}
