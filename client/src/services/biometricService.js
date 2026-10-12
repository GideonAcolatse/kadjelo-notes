const BIOMETRIC_CRED_KEY = 'kadjelo_biometric_cred_id';

export async function hashPin(pin) {
  const cleanPin = String(pin).trim();
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`kadjelo-salt:${cleanPin}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic hash if crypto.subtle unavailable on non-HTTPS LAN IP
  let hash = 0;
  const salted = `kadjelo-salt:${cleanPin}`;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${Math.abs(hash)}`;
}

export async function isBiometricAvailable() {
  try {
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasRegisteredBiometric() {
  return Boolean(localStorage.getItem(BIOMETRIC_CRED_KEY));
}

function randomChallenge(length = 32) {
  const arr = new Uint8Array(length);
  window.crypto.getRandomValues(arr);
  return arr;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function registerBiometricPasskey() {
  const available = await isBiometricAvailable();
  if (!available) {
    throw new Error('Biometric sensor (FaceID / TouchID / Fingerprint) is not available on this device.');
  }

  const userId = randomChallenge(16);
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(32),
      rp: {
        name: 'Kadjelo Notes Privacy Vault',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: 'vault@kadjelo.notes',
        displayName: 'Kadjelo Notes Owner'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 45000
    }
  });

  if (credential && credential.rawId) {
    const encodedId = bufferToBase64(credential.rawId);
    localStorage.setItem(BIOMETRIC_CRED_KEY, encodedId);
    return encodedId;
  }
  throw new Error('Biometric registration was cancelled.');
}

export async function verifyBiometricPasskey() {
  const storedId = localStorage.getItem(BIOMETRIC_CRED_KEY);
  if (!storedId) {
    await registerBiometricPasskey();
    return true;
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(32),
      allowCredentials: [
        {
          id: base64ToBuffer(storedId),
          type: 'public-key',
          transports: ['internal']
        }
      ],
      userVerification: 'required',
      timeout: 45000
    }
  });

  return Boolean(assertion);
}
