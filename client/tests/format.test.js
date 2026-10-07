import { describe, expect, it } from 'vitest';
import { formatClock, formatMinutes, relativeDays } from '../src/utils/format.js';

describe('relativeDays', () => {
  it.each([
    [0, 'danes'],
    [1, 'jutri'],
    [5, 'čez 5 dni'],
    [-1, 'včeraj'],
    [-2, 'pred 2 dnevoma'],
    [-7, 'pred 7 dnevi'],
  ])('%i -> %s', (days, expected) => {
    expect(relativeDays(days)).toBe(expected);
  });
});

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [40, '40 min'],
    [60, '1 h'],
    [95, '1 h 35 min'],
  ])('%i -> %s', (min, expected) => {
    expect(formatMinutes(min)).toBe(expected);
  });
});

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(25 * 60)).toBe('25:00');
    expect(formatClock(65)).toBe('01:05');
  });

  it('never shows negative time', () => {
    expect(formatClock(-3)).toBe('00:00');
  });
});
