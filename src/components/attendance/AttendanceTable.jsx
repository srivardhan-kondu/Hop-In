import { formatDate, formatTime } from '../../utils/date';

function AttendanceTable({ rows, filters, onFiltersChange, onExportCsv }) {
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <h2>Attendance History</h2>
        <button className="btn btn-outline btn-sm" type="button" onClick={onExportCsv}>
          📥 Export CSV
        </button>
      </div>

      <div className="action-row" style={{ marginBottom: '1rem' }}>
        <label className="form-field" style={{ flex: 1, minWidth: '140px', margin: 0 }}>
          <span>From</span>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
          />
        </label>
        <label className="form-field" style={{ flex: 1, minWidth: '140px', margin: 0 }}>
          <span>To</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
          />
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Boarding Time</th>
              <th>School Arrival</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.date)}</td>
                <td>{formatTime(row.boardingTime)}</td>
                <td>
                  {row.schoolArrivalTime
                    ? formatTime(row.schoolArrivalTime)
                    : <span className="badge-pending" style={{ fontSize: '0.72rem' }}>In transit</span>
                  }
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }} className="muted">No attendance records in this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendanceTable;
