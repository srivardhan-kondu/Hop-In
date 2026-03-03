import { describe, expect, it } from 'vitest';
import { geofenceLevel, haversineDistanceKm } from '../src/utils/haversine';

describe('haversineDistanceKm', () => {
  it('returns near zero for same coordinates', () => {
    expect(haversineDistanceKm(12.9, 77.5, 12.9, 77.5)).toBeCloseTo(0, 5);
  });

  it('calculates known city distance', () => {
    const d = haversineDistanceKm(12.9716, 77.5946, 13.0827, 80.2707);
    expect(d).toBeGreaterThan(280);
    expect(d).toBeLessThan(310);
  });
});

describe('geofenceLevel', () => {
  it('matches threshold bands', () => {
    expect(geofenceLevel(1.2)).toBe('none');
    expect(geofenceLevel(0.9)).toBe('approaching');
    expect(geofenceLevel(0.2)).toBe('almost_here');
  });
});
