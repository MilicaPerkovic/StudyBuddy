import { useEffect, useRef, useState } from 'react';
import { formatClock } from '../utils/format.js';

/**
 * Countdown timer. When it reaches 0 it calls `onComplete(startedAtIso, minutes)`.
 * Stopping early also logs the elapsed whole minutes (if at least 1).
 */
export default function StudyTimer({ onComplete, presets = [25, 50] }) {
  const [length, setLength] = useState(presets[0]);
  const [remaining, setRemaining] = useState(presets[0] * 60);
  const [running, setRunning] = useState(false);
  const startedAt = useRef(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && remaining <= 0) {
      setRunning(false);
      onComplete(startedAt.current, length);
      setRemaining(length * 60);
    }
  }, [remaining, running, length, onComplete]);

  const start = () => {
    if (!startedAt.current || remaining === length * 60)
      startedAt.current = new Date().toISOString();
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    const elapsed = Math.floor((length * 60 - remaining) / 60);
    if (elapsed >= 1) onComplete(startedAt.current, elapsed);
    setRemaining(length * 60);
    startedAt.current = null;
  };

  const choose = (m) => {
    setLength(m);
    setRemaining(m * 60);
  };

  return (
    <div className="timer">
      <div className="clock" role="timer">
        {formatClock(remaining)}
      </div>
      <div className="actions">
        {presets.map((m) => (
          <button
            key={m}
            className={m === length ? '' : 'secondary'}
            onClick={() => choose(m)}
            disabled={running}
          >
            {m} min
          </button>
        ))}
      </div>
      <div className="actions">
        {running ? (
          <button onClick={() => setRunning(false)}>Pavza</button>
        ) : (
          <button onClick={start}>Začni</button>
        )}
        <button className="secondary" onClick={stop} disabled={remaining === length * 60}>
          Končaj in shrani
        </button>
      </div>
    </div>
  );
}
