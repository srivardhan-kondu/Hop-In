const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deriveKey(secret) {
  const raw = encoder.encode(secret.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptText(plainText) {
  const secret = import.meta.env.VITE_AADHAAR_ENCRYPTION_SECRET;
  if (!secret) return plainText;

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plainText));

  return `${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decryptText(cipherText) {
  const secret = import.meta.env.VITE_AADHAAR_ENCRYPTION_SECRET;
  if (!secret) return cipherText;

  const [ivPart, dataPart] = cipherText.split(':');
  const iv = Uint8Array.from(atob(ivPart), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataPart), (c) => c.charCodeAt(0));

  const key = await deriveKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return decoder.decode(decrypted);
}
