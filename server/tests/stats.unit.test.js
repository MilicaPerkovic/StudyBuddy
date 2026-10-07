import { describe, expect, it } from 'vitest';
import { daysUntil, minutesPerDay, startOfWeek } from '../src/services/stats.js';

describe('startOfWeek', () => {
  it('returns Monday for a Wednesday', () => {
    expect(startOfWeek(new Date('2026-10-07T15:00:00Z')).toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    );
  });

  it('treats Sunday as the last day of the week', () => {
    expect(startOfWeek(new Date('2026-10-11T23:00:00Z')).toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    );
  });

  it('returns the same day for a Monday', () => {
    expect(startOfWeek(new Date('2026-10-05T00:00:00Z')).toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    );
  });
});

describe('daysUntil', () => {
  const now = new Date('2026-10-07T18:00:00Z');

  it('is 0 for later today', () => {
    expect(daysUntil('2026-10-07T23:00:00Z', now)).toBe(0);
  });

  it('counts calendar days ahead', () => {
    expect(daysUntil('2026-10-10T08:00:00Z', now)).toBe(3);
  });

  it('is negative when overdue', () => {
    expect(daysUntil('2026-10-05T08:00:00Z', now)).toBe(-2);
  });
});

describe('minutesPerDay', () => {
  it('sums sessions into 7 daily buckets and ignores other weeks', () => {
    const weekStart = new Date('2026-10-05T00:00:00Z');
    const result = minutesPerDay(
      [
        { started_at: '2026-10-05T09:00:00Z', duration_minutes: 30 },
        { started_at: '2026-10-05T18:00:00Z', duration_minutes: 20 },
        { started_at: '2026-10-11T10:00:00Z', duration_minutes: 60 },
        { started_at: '2026-10-12T10:00:00Z', duration_minutes: 999 },
      ],
      weekStart,
    );
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ date: '2026-10-05', minutes: 50 });
    expect(result[6]).toEqual({ date: '2026-10-11', minutes: 60 });
    expect(result.reduce((s, d) => s + d.minutes, 0)).toBe(110);
  });
});
