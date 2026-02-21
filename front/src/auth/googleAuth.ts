export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
export const isGoogleAuthConfigured = googleClientId.length > 0;

export interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

export interface GoogleIdTokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

type GoogleCallback = (response: GoogleCredentialResponse) => void;

interface GoogleAccountsIdApi {
  initialize: (config: { client_id: string; callback: GoogleCallback }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number | string;
      locale?: string;
    }
  ) => void;
  prompt: () => void;
  disableAutoSelect: () => void;
}

interface GoogleIdentityWindow {
  accounts: {
    id: GoogleAccountsIdApi;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityWindow;
  }
}

let googleScriptPromise: Promise<void> | null = null;

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

export const decodeGoogleCredential = (
  credential: string
): GoogleIdTokenPayload | null => {
  try {
    const payload = credential.split('.')[1];
    if (!payload) {
      return null;
    }

    const decoded = decodeBase64Url(payload);
    return JSON.parse(decoded) as GoogleIdTokenPayload;
  } catch {
    return null;
  }
};

export const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services requires a browser environment.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');

    if (existingScript) {
      if (window.google?.accounts?.id || existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';

    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    script.onerror = () => {
      googleScriptPromise = null;
      reject(new Error('Failed to load Google Identity Services script.'));
    };

    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export const renderGoogleSignInButton = (
  targetElement: HTMLElement,
  callback: GoogleCallback
): void => {
  if (!isGoogleAuthConfigured) {
    throw new Error('Google auth is not configured.');
  }

  const googleIdApi = window.google?.accounts?.id;
  if (!googleIdApi) {
    throw new Error('Google Identity Services API is not available.');
  }

  targetElement.innerHTML = '';
console.log("My Client ID:", googleClientId);
  googleIdApi.initialize({
    client_id: googleClientId,
    callback,
  });

  googleIdApi.renderButton(targetElement, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    width: 320,
  });
};

export const disableGoogleAutoSelect = (): void => {
  const googleIdApi = window.google?.accounts?.id;
  if (!googleIdApi) {
    return;
  }

  googleIdApi.disableAutoSelect();
};
