export type RecaptchaVerifyResult = {
  success: boolean;
  score?: number;
  error?: string;
  skipped?: boolean;
};

type SiteVerifyResponse = {
  success: boolean;
  score?: number;
  "error-codes"?: string[];
};

export async function verifyRecaptchaToken(token: string): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return { success: true, score: 1, skipped: true };
    }
    return { success: false, error: "reCAPTCHA not configured" };
  }

  if (!token.trim()) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true, score: 1, skipped: true };
    }
    return { success: false, error: "Missing reCAPTCHA token" };
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await response.json()) as SiteVerifyResponse;

  if (!data.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[recaptcha] Invalid token bypassed in development");
      return { success: true, score: 1, skipped: true };
    }
    return { success: false, error: "Invalid reCAPTCHA" };
  }

  const score = data.score ?? 0;
  if (score < 0.3) {
    return { success: false, score, error: "Bot detected" };
  }

  if (score < 0.5) {
    console.warn("[recaptcha] Low score allowed:", score);
  }

  return { success: true, score };
}
