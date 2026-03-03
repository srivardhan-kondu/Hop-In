import { describe, expect, it } from 'vitest';
import { calculatePerformanceScore } from '../src/utils/performance';
import { currentVacancy, totalContractValue } from '../src/utils/pricing';

describe('calculatePerformanceScore', () => {
  it('matches weighted formula', () => {
    const score = calculatePerformanceScore({
      averageRating: 4.5,
      attendanceAccuracy: 98,
      punctualityScore: 95,
      tripCompletionRate: 100,
    });

    expect(score).toBeCloseTo(94.4, 1);
  });

  it('clamps out-of-range values', () => {
    const score = calculatePerformanceScore({
      averageRating: 10,
      attendanceAccuracy: 120,
      punctualityScore: -10,
      tripCompletionRate: 50,
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('pricing rules', () => {
  it('computes total contract value', () => {
    expect(totalContractValue(2500, 12)).toBe(30000);
  });

  it('computes current vacancy', () => {
    expect(currentVacancy(20, [{}, {}, {}])).toBe(17);
  });
});
