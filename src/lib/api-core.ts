import { toErrorMessage } from "@/lib/errors";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8090";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg ?? "").join("; ");
    }
  } catch {
    /* ignore */
  }
  return `HTTP ${res.status}: ${res.statusText}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      `Backend недоступен (${API_URL}). Запустите: cd SAAS_IDEA_AI_MVP_FACTORY && ./run/api.sh` +
        (error instanceof Error && error.message ? ` (${error.message})` : "")
    );
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  try {
    return (await res.json()) as T;
  } catch (error) {
    throw new ApiError(
      `Некорректный JSON от API: ${toErrorMessage(error, "parse error")}`
    );
  }
}

export function getApiUrl(): string {
  return API_URL;
}
