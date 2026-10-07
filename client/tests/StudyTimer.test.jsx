import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StudyTimer from '../src/components/StudyTimer.jsx';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('StudyTimer', () => {
  it('starts at the first preset', () => {
    render(<StudyTimer onComplete={() => {}} />);
    expect(screen.getByRole('timer')).toHaveTextContent('25:00');
  });

  it('switches preset', () => {
    render(<StudyTimer onComplete={() => {}} />);
    fireEvent.click(screen.getByText('50 min'));
    expect(screen.getByRole('timer')).toHaveTextContent('50:00');
  });

  it('counts down while running and pauses', () => {
    render(<StudyTimer onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Začni'));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('timer')).toHaveTextContent('24:57');
    fireEvent.click(screen.getByText('Pavza'));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('timer')).toHaveTextContent('24:57');
  });

  it('calls onComplete with the full length when finished', () => {
    const onComplete = vi.fn();
    render(<StudyTimer onComplete={onComplete} presets={[1]} />);
    fireEvent.click(screen.getByText('Začni'));
    act(() => vi.advanceTimersByTime(60_000));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete.mock.calls[0][1]).toBe(1);
    expect(screen.getByRole('timer')).toHaveTextContent('01:00');
  });

  it('logs elapsed minutes when stopped early', () => {
    const onComplete = vi.fn();
    render(<StudyTimer onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Začni'));
    act(() => vi.advanceTimersByTime(3 * 60_000 + 10_000));
    fireEvent.click(screen.getByText('Končaj in shrani'));
    expect(onComplete).toHaveBeenCalledWith(expect.any(String), 3);
  });

  it('does not log less than one minute', () => {
    const onComplete = vi.fn();
    render(<StudyTimer onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Začni'));
    act(() => vi.advanceTimersByTime(30_000));
    fireEvent.click(screen.getByText('Končaj in shrani'));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
