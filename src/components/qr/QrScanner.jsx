import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * QR Scanner with two modes:
 *  1. Camera – live viewfinder via Html5Qrcode.start()
 *  2. File   – user picks / drops an image → decoded via jsQR (canvas-based)
 *
 * File scanning uses jsQR instead of html5-qrcode because the ZXing decoder
 * in html5-qrcode is unreliable with dense QR codes from screenshots.
 */

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
};

/* ------------------------------------------------------------------ */
/*  jsQR-based image decoder                                          */
/* ------------------------------------------------------------------ */
function decodeQrFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Draw to an off-screen canvas so we can read pixel data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',   // try normal + inverted
        });

        if (result?.data) {
          resolve(result.data);
        } else {
          reject(new Error('Could not read QR code from this image.'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load the image.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
function QrScanner({ id = 'hopin-qr-scanner', onDecoded }) {
  const onDecodedRef = useRef(onDecoded);
  onDecodedRef.current = onDecoded;

  const scannerRef = useRef(null);
  const [mode, setMode] = useState('file'); // 'camera' | 'file'
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef(null);

  /* ---------- camera helpers ---------- */
  const stopCamera = useCallback(async () => {
    try {
      const s = scannerRef.current;
      if (s && s.isScanning) await s.stop();
    } catch { /* ignore */ }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(id, {
          formatsToSupport: SCANNER_CONFIG.formatsToSupport,
          verbose: false,
        });
      }
      const scanner = scannerRef.current;
      if (scanner.isScanning) await scanner.stop();

      await scanner.start(
        { facingMode: 'environment' },
        SCANNER_CONFIG,
        (decodedText) => onDecodedRef.current(decodedText),
        () => {},          // per-frame miss — normal, ignore
      );
      setCameraActive(true);
    } catch (err) {
      const msg = err?.message ?? '';
      setError(
        msg.includes('NotAllowed') || msg.includes('Permission')
          ? 'Camera permission denied. Please allow camera access.'
          : `Could not start camera: ${msg || 'Unknown error'}`,
      );
    }
  }, [id]);

  /* ---------- file scanning ---------- */
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setScanning(true);
    try {
      const decoded = await decodeQrFromFile(file);
      onDecodedRef.current(decoded);
    } catch {
      setError(
        'Could not read QR code from this image. Make sure the image is clear and contains a valid QR code.',
      );
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  /* ---------- mode switch ---------- */
  useEffect(() => {
    if (mode === 'camera') startCamera();
    else stopCamera();
  }, [mode, startCamera, stopCamera]);

  useEffect(() => () => { stopCamera(); scannerRef.current = null; }, [stopCamera]);

  /* ---------- drag & drop ---------- */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };

  /* ---------- render ---------- */
  return (
    <div className="qr-scanner-wrapper">
      {error && (
        <div
          className="error-text"
          style={{
            background: 'var(--c-danger, #e74c3c)',
            color: '#fff',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Camera viewfinder — always in DOM so Html5Qrcode can attach */}
      <div
        id={id}
        style={{
          width: '100%',
          minHeight: mode === 'camera' ? 280 : 0,
          maxHeight: mode === 'camera' ? 'unset' : 0,
          overflow: 'hidden',
          background: mode === 'camera' ? '#111' : 'transparent',
          borderRadius: '0.5rem',
          marginBottom: mode === 'camera' ? '0.75rem' : 0,
        }}
      />

      {/* File upload area */}
      {mode === 'file' && (
        <div
          onDrop={handleDrop}
          onDragOver={prevent}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--c-border, #555)',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '0.75rem',
            background: 'var(--c-surface, #1a1a2e)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {scanning ? '⏳ Scanning…' : '📷 Click to choose an image, or drag & drop'}
          </p>
          <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>
            Upload a photo or screenshot of the child's QR code
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
          onClick={() => setMode((m) => (m === 'camera' ? 'file' : 'camera'))}
        >
          {mode === 'camera' ? '📁 Upload image instead' : '📹 Scan using camera directly'}
        </button>
      </div>
    </div>
  );
}

export default QrScanner;
