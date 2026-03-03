import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

function QrScanner({ id = 'hopin-qr-scanner', onDecoded }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: 220 }, false);
    scanner.render(
      (text) => {
        onDecoded(text);
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [id, onDecoded]);

  return <div id={id} className="panel" />;
}

export default QrScanner;
