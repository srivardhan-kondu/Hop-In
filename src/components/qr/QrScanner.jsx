import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

function QrScanner({ id = 'hopin-qr-scanner', onDecoded }) {
  const onDecodedRef = useRef(onDecoded);
  onDecodedRef.current = onDecoded;

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          Html5QrcodeScanType.SCAN_TYPE_FILE,
        ],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        rememberLastUsedCamera: true,
      },
      false,
    );

    scanner.render(
      (text) => {
        onDecodedRef.current(text);
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [id]);

  return <div id={id} className="panel" />;
}

export default QrScanner;
