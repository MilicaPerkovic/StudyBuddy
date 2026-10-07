import { describe, expect, it } from 'vitest';
import { ectsWeightedAverage, weightedAverage } from '../src/services/grades.js';

describe('weightedAverage', () => {
  it('returns null for an empty list', () => {
    expect(weightedAverage([])).toBeNull();
  });

  it('returns null when total weight is 0', () => {
    expect(weightedAverage([{ grade: 8, weight: 0 }])).toBeNull();
  });

  it('computes a weighted average', () => {
    expect(
      weightedAverage([
        { grade: 10, weight: 30 },
        { grade: 6, weight: 70 },
      ]),
    ).toBe(7.2);
  });

  it('rounds to two decimals', () => {
    expect(
      weightedAverage([
        { grade: 7, weight: 1 },
        { grade: 8, weight: 1 },
        { grade: 8, weight: 1 },
      ]),
    ).toBe(7.67);
  });
});

describe('ectsWeightedAverage', () => {
  it('skips courses without an average', () => {
    expect(
      ectsWeightedAverage([
        { average: 10, ects: 6 },
        { average: null, ects: 6 },
        { average: 7, ects: 3 },
      ]),
    ).toBe(9);
  });

  it('returns null when no course is graded', () => {
    expect(ectsWeightedAverage([{ average: null, ects: 6 }])).toBeNull();
  });
});
