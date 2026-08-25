function isDomEvent(value: unknown): value is Event {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof (value as Event).type === "string"
  );
}

/** Безопасное сообщение из unknown (никогда не [object Event]). */
export function toErrorMessage(error: unknown, fallback = "Неизвестная ошибка"): string {
  if (error instanceof Error) {
    const message = error.message?.trim();
    if (!message || message === "[object Event]" || message === "[object Object]") {
      return fallback;
    }
    return message;
  }
  if (typeof error === "string") {
    const message = error.trim();
    if (!message || message === "[object Event]" || message === "[object Object]") {
      return fallback;
    }
    return message;
  }
  if (error === null || error === undefined) {
    return fallback;
  }
  if (isDomEvent(error)) {
    return error.type ? `${fallback} (${error.type})` : fallback;
  }
  const text = String(error).trim();
  if (!text || text === "[object Event]" || text === "[object Object]") {
    return fallback;
  }
  return text;
}

/** Alias for API routes and catch blocks. */
export const normalizeError = toErrorMessage;
