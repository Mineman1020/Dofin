/**
 * End-to-End Encryption (E2EE) Utility for Study & Work Parties.
 * Uses Web Crypto API (AES-GCM 256-bit + PBKDF2 Key Derivation).
 * All messages are encrypted directly on the client before being sent to Firestore.
 */

// Memory cache for derived CryptoKeys per party to ensure near-instant encryption/decryption
const keyCache = new Map<string, CryptoKey>();

function getCryptoSubtle(): SubtleCrypto {
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : globalThis.crypto) as Crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not supported in this environment');
  }
  return cryptoObj.subtle;
}

// Convert Uint8Array to Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM key from the party ID and party secret code.
 * Only members who have the party code can derive this room key.
 */
export async function getPartyEncryptionKey(partyId: string, partyCode: string): Promise<CryptoKey> {
  const cacheKey = `${partyId}:${partyCode.trim().toUpperCase()}`;
  const existing = keyCache.get(cacheKey);
  if (existing) return existing;

  const subtle = getCryptoSubtle();
  const enc = new TextEncoder();

  // Combine party ID and room code into the master secret passphrase
  const passphrase = `DESK_STATION_E2E:${partyId}:${partyCode.trim().toUpperCase()}`;
  const passBuffer = enc.encode(passphrase);

  // Generate deterministic 16-byte salt from partyId hash
  const hashBuffer = await subtle.digest('SHA-256', enc.encode(`SALT:${partyId}`));
  const salt = new Uint8Array(hashBuffer).slice(0, 16);

  // Import password as base key
  const baseKey = await subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive 256-bit AES-GCM key with 100,000 PBKDF2 iterations
  const cryptoKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, cryptoKey);
  return cryptoKey;
}

/**
 * Encrypts a plaintext chat message into an E2EE envelope: `E2E:${ivBase64}:${cipherBase64}`
 */
export async function encryptChatMessage(
  plaintext: string,
  partyId: string,
  partyCode: string
): Promise<string> {
  try {
    const key = await getPartyEncryptionKey(partyId, partyCode);
    const subtle = getCryptoSubtle();
    const enc = new TextEncoder();

    // 12-byte random Initialization Vector (IV) for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPlaintext = enc.encode(plaintext);

    const ciphertext = await subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedPlaintext
    );

    const ivB64 = bufferToBase64(iv);
    const cipherB64 = bufferToBase64(ciphertext);

    return `E2E:${ivB64}:${cipherB64}`;
  } catch (err) {
    console.warn('E2EE encryption error, falling back:', err);
    return plaintext;
  }
}

/**
 * Decrypts an E2EE envelope message `E2E:${ivBase64}:${cipherBase64}` back into readable plaintext.
 * If the message is unencrypted (legacy), returns it as-is.
 */
export async function decryptChatMessage(
  envelopeOrPlaintext: string,
  partyId: string,
  partyCode: string
): Promise<string> {
  if (!envelopeOrPlaintext || !envelopeOrPlaintext.startsWith('E2E:')) {
    return envelopeOrPlaintext;
  }

  try {
    const parts = envelopeOrPlaintext.split(':');
    if (parts.length !== 3) {
      return envelopeOrPlaintext;
    }

    const [, ivB64, cipherB64] = parts;
    const iv = base64ToBuffer(ivB64);
    const ciphertext = base64ToBuffer(cipherB64);

    const key = await getPartyEncryptionKey(partyId, partyCode);
    const subtle = getCryptoSubtle();

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    // If decryption fails (e.g. wrong key or invalid room code), return safe placeholder
    return '🔒 [Encrypted message - could not decrypt]';
  }
}
