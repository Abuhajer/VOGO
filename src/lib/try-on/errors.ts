export type TryOnErrorCode = "RATE_LIMIT" | "QUOTA_EXCEEDED" | "CONFIG" | "UNKNOWN";

export type TryOnErrorPayload = {
  code: TryOnErrorCode;
  message: string;
  retryAfterSeconds?: number;
  httpStatus: number;
};

const QUOTA_PATTERN = /limit:\s*0|free_tier|quota exceeded|exceeded your current quota/i;
const RATE_LIMIT_PATTERN = /rate limit|429|too many requests|resource exhausted/i;

export function parseRetrySecondsFromMessage(message: string): number | undefined {
  const m = /retry in ([\d.]+)s|wait[:\s]+~?([\d.]+)s|Suggested wait before retry: ~([\d.]+)s/i.exec(
    message
  );
  const sec = parseFloat(m?.[1] ?? m?.[2] ?? m?.[3] ?? "");
  if (!Number.isNaN(sec) && sec > 0) {
    return Math.min(120, Math.ceil(sec));
  }
  return undefined;
}

export function classifyTryOnError(message: string): TryOnErrorPayload {
  if (
    message.includes("GEMINI_API_KEY") ||
    message.includes("NVIDIA_API_KEY") ||
    message.includes("not configured") ||
    message.includes("authorization failed")
  ) {
    return { code: "CONFIG", message, httpStatus: 503 };
  }

  if (QUOTA_PATTERN.test(message)) {
    return {
      code: "QUOTA_EXCEEDED",
      message,
      retryAfterSeconds: 3600,
      httpStatus: 429,
    };
  }

  if (RATE_LIMIT_PATTERN.test(message)) {
    return {
      code: "RATE_LIMIT",
      message,
      retryAfterSeconds: parseRetrySecondsFromMessage(message) ?? 60,
      httpStatus: 429,
    };
  }

  return { code: "UNKNOWN", message, httpStatus: 500 };
}
