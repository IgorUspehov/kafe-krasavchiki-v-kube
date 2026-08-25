declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function getRecaptchaSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey || typeof window === "undefined" || !window.grecaptcha) {
    return null;
  }

  return new Promise((resolve) => {
    window.grecaptcha!.ready(() => {
      void window
        .grecaptcha!.execute(siteKey, { action })
        .then((token) => resolve(token))
        .catch(() => resolve(null));
    });
  });
}
