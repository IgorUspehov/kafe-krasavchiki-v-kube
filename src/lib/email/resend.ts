export type ClientLanguage = "ru" | "de" | "en";

export function resolveClientLanguage(value: unknown): ClientLanguage {
  const language = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (language === "ru" || language === "de" || language === "en") {
    return language;
  }
  return "en";
}

export type ResendAttachment = {
  filename: string;
  content: Buffer;
};

export type ResendSendResult = {
  ok: boolean;
  status?: number;
  body?: string;
  emailId?: string;
  error?: string;
  errorName?: string;
  errorMessage?: string;
  from?: string;
  to?: string;
  resendApiKeyConfigured: boolean;
};

export type ResendEmailStatus = {
  ok: boolean;
  status?: number;
  body?: string;
  emailId?: string;
  lastEvent?: string;
  recipient?: string;
  from?: string;
  subject?: string;
  error?: string;
  errorName?: string;
  errorMessage?: string;
};

type ResendErrorBody = {
  name?: string;
  message?: string;
  statusCode?: number;
};

type ResendSendSuccessBody = {
  id?: string;
};

type ResendEmailRecord = {
  id?: string;
  to?: string[];
  from?: string;
  subject?: string;
  last_event?: string;
};

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonBody(body: string): Record<string, unknown> | null {
  if (!body.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractResendError(parsed: Record<string, unknown> | null): {
  errorName?: string;
  errorMessage?: string;
} {
  if (!parsed) {
    return {};
  }

  return {
    errorName: pickString(parsed.name) || undefined,
    errorMessage: pickString(parsed.message) || undefined,
  };
}

function logResendResponse(
  logPrefix: string,
  input: {
    status: number;
    body: string;
    to: string;
    from: string;
    emailId?: string;
    errorName?: string;
    errorMessage?: string;
  },
): void {
  console.log(`${logPrefix} response`, {
    httpStatus: input.status,
    body: input.body,
    emailId: input.emailId ?? null,
    errorName: input.errorName ?? null,
    errorMessage: input.errorMessage ?? null,
    to: input.to,
    from: input.from,
  });
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  attachments?: ResendAttachment[];
  logPrefix?: string;
}): Promise<ResendSendResult> {
  const logPrefix = input.logPrefix ?? "[email/resend]";
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = input.from ?? process.env.RESEND_FROM_EMAIL?.trim();
  const to = pickString(input.to);
  const resendApiKeyConfigured = Boolean(apiKey);

  if (!apiKey) {
    const error = "RESEND_API_KEY is not configured";
    console.error(`${logPrefix} ${error}`);
    return { ok: false, error, resendApiKeyConfigured, to };
  }
  if (!from) {
    const error = "from address is not configured";
    console.error(`${logPrefix} ${error}`);
    return { ok: false, error, from, to, resendApiKeyConfigured };
  }
  if (!to) {
    const error = "recipient is empty";
    console.error(`${logPrefix} ${error}`);
    return { ok: false, error, from, to, resendApiKeyConfigured };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
      ...(input.attachments?.length
        ? {
            attachments: input.attachments.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content.toString("base64"),
            })),
          }
        : {}),
    }),
  });

  const body = await response.text();
  const parsed = parseJsonBody(body);
  const { errorName, errorMessage } = extractResendError(parsed);
  const emailId = pickString((parsed as ResendSendSuccessBody | null)?.id) || undefined;

  logResendResponse(logPrefix, {
    status: response.status,
    body,
    to,
    from,
    emailId,
    errorName,
    errorMessage,
  });

  if (!response.ok) {
    const error = errorMessage || `Resend API error (${response.status})`;
    return {
      ok: false,
      status: response.status,
      body,
      error,
      errorName,
      errorMessage,
      from,
      to,
      resendApiKeyConfigured,
    };
  }

  if (!emailId) {
    const error = "Resend API returned HTTP success without email id";
    console.error(`${logPrefix} missing email id`, { httpStatus: response.status, body });
    return {
      ok: false,
      status: response.status,
      body,
      error,
      errorName,
      errorMessage,
      from,
      to,
      resendApiKeyConfigured,
    };
  }

  return {
    ok: true,
    status: response.status,
    body,
    emailId,
    from,
    to,
    resendApiKeyConfigured,
  };
}

export async function getResendEmailStatus(
  emailId: string,
  logPrefix = "[email/resend]",
): Promise<ResendEmailStatus> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const normalizedId = pickString(emailId);

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }
  if (!normalizedId) {
    return { ok: false, error: "emailId is empty" };
  }

  const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(normalizedId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const body = await response.text();
  const parsed = parseJsonBody(body);
  const { errorName, errorMessage } = extractResendError(parsed);

  console.log(`${logPrefix} status lookup`, {
    httpStatus: response.status,
    body,
    emailId: normalizedId,
    errorName: errorName ?? null,
    errorMessage: errorMessage ?? null,
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body,
      emailId: normalizedId,
      error: errorMessage || `Resend status lookup failed (${response.status})`,
      errorName,
      errorMessage,
    };
  }

  const record = parsed as ResendEmailRecord | null;
  const recipient = Array.isArray(record?.to) ? pickString(record?.to[0]) : undefined;

  return {
    ok: true,
    status: response.status,
    body,
    emailId: pickString(record?.id) || normalizedId,
    lastEvent: pickString(record?.last_event) || undefined,
    recipient,
    from: pickString(record?.from) || undefined,
    subject: pickString(record?.subject) || undefined,
  };
}

const TERMINAL_RESEND_EVENTS = new Set([
  "delivered",
  "bounced",
  "failed",
  "suppressed",
  "complained",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForResendDeliveryStatus(
  emailId: string,
  options?: { attempts?: number; delayMs?: number; logPrefix?: string },
): Promise<ResendEmailStatus> {
  const attempts = options?.attempts ?? 4;
  const delayMs = options?.delayMs ?? 2000;
  const logPrefix = options?.logPrefix ?? "[email/resend]";

  let latest: ResendEmailStatus = { ok: false, error: "status lookup not started" };

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    latest = await getResendEmailStatus(emailId, logPrefix);
    const lastEvent = pickString(latest.lastEvent).toLowerCase();

    console.log(`${logPrefix} delivery poll`, {
      attempt,
      attempts,
      emailId,
      lastEvent: lastEvent || null,
      recipient: latest.recipient ?? null,
      lookupOk: latest.ok,
      lookupError: latest.error ?? null,
    });

    if (latest.ok && lastEvent && TERMINAL_RESEND_EVENTS.has(lastEvent)) {
      return latest;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  return latest;
}
