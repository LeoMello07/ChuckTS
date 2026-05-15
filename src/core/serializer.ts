import { HttpRecord } from '../types';

const DEFAULT_MAX_SIZE = 32768; // 32 KB

export function safeStringify(value: unknown, maxSize = DEFAULT_MAX_SIZE): string | null {
  if (value === null || value === undefined) return null;

  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (str.length > maxSize) {
      return str.slice(0, maxSize) + `\n\n[ChuckTS] Truncated — original size: ${str.length} bytes`;
    }
    return str;
  } catch {
    return '[ChuckTS] Could not serialize body';
  }
}

export function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }

  return headers as Record<string, string>;
}

export function byteSize(str: string | null | undefined): number {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
}

export function parseResponseBody(
  body: string | null,
  contentType: string | undefined
): string | null {
  if (!body) return null;

  const isJson =
    contentType?.includes('application/json') ||
    contentType?.includes('text/json');

  if (isJson) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }

  return body;
}

export function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return contentType.includes('application/json') || contentType.includes('text/json');
}

export function buildPartialRecord(
  overrides: Partial<HttpRecord>
): Partial<HttpRecord> {
  return {
    requestHeaders: {},
    requestBody: null,
    responseHeaders: {},
    responseBody: null,
    statusCode: null,
    duration: null,
    requestSize: 0,
    responseSize: 0,
    status: 'pending',
    error: null,
    isTimeout: false,
    isCancelled: false,
    ...overrides,
  };
}
