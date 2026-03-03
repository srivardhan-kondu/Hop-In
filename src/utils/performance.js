export function calculatePerformanceScore({
  averageRating = 0,
  attendanceAccuracy = 0,
  punctualityScore = 0,
  tripCompletionRate = 0,
}) {
  const normalizedRating = Math.max(0, Math.min(5, Number(averageRating))) / 5;
  const normalizedAttendance = Math.max(0, Math.min(100, Number(attendanceAccuracy))) / 100;
  const normalizedPunctuality = Math.max(0, Math.min(100, Number(punctualityScore))) / 100;
  const normalizedTripCompletion = Math.max(0, Math.min(100, Number(tripCompletionRate))) / 100;

  return (
    (normalizedRating * 0.4 + normalizedAttendance * 0.3 + normalizedPunctuality * 0.2 + normalizedTripCompletion * 0.1) *
    100
  );
}
