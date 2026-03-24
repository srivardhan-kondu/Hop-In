import QRCode from 'react-qr-code';

function ChildQrCard({ child, vanId, parentId }) {
  const qrPayload = JSON.stringify({
    childId: child.childId,
    childName: child.name,
    parentId,
    vanId,
  });

  const initial = child.name?.[0]?.toUpperCase() ?? 'C';

  return (
    <article className="panel child-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <div className="child-avatar">{initial}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{child.name}</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>{child.schoolName}</p>
        </div>
      </div>
      <div className="qr-frame">
        <QRCode value={qrPayload} size={160} level="H" />
      </div>
    </article>
  );
}

export default ChildQrCard;
