import { useState } from 'react';
import { createEmergencyAlert } from '../../services/db/alerts';

function EmergencyButton({ reportedBy, role, vanId, location }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const trigger = async () => {
    if (!description.trim()) return;

    setSending(true);
    setStatus('');
    try {
      await createEmergencyAlert({
        reportedBy,
        role,
        vanId,
        description: description.trim(),
        location,
      });
      setStatus('Emergency alert sent to admins.');
      setDescription('');
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="stack gap-sm">
      <button
        className={`btn btn-danger btn-pulse ${open ? '' : 'btn-lg'}`}
        onClick={() => setOpen((value) => !value)}
        disabled={sending}
        style={{ width: '100%' }}
      >
        {open ? '✕ Cancel' : '🚨 Emergency Alert'}
      </button>
      {open && (
        <div className="emergency-box" style={{ marginTop: '0.5rem' }}>
          <label className="form-field">
            <span>Describe the emergency</span>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Vehicle breakdown, child is ill, route hazard..."
            />
          </label>
          <button
            className="btn btn-danger"
            onClick={trigger}
            disabled={sending || !description.trim()}
            style={{ width: '100%' }}
          >
            {sending ? 'Sending...' : 'Send Emergency Alert to Admin'}
          </button>
        </div>
      )}
      {status && <p className="success-text" style={{ textAlign: 'center' }}>✓ {status}</p>}
    </div>
  );
}

export default EmergencyButton;
