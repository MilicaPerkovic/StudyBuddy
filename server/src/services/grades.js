/**
 * Weighted average of grades. Each item is `{ grade, weight }`.
 * Returns null when there are no grades or the total weight is 0.
 * Result is rounded to 2 decimals.
 */
export function weightedAverage(items) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (items.length === 0 || totalWeight <= 0) return null;
  const sum = items.reduce((acc, i) => acc + i.grade * i.weight, 0);
  return Math.round((sum / totalWeight) * 100) / 100;
}

/**
 * ECTS-weighted average across courses. Each item is `{ average, ects }`;
 * courses without an average (null) are skipped.
 */
export function ectsWeightedAverage(courses) {
  const graded = courses.filter((c) => c.average !== null && c.average !== undefined);
  return weightedAverage(graded.map((c) => ({ grade: c.average, weight: c.ects })));
}
