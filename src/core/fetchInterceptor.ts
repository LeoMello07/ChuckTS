import { HttpRecord } from '../types';
import { safeStringify, headersToRecord, byteSize, buildPartialRecord } from './serializer';
import { generateId, getInterceptorContext } from './interceptor';

let _originalFetch: typeof fetch | null = null;
let _attached = false;

export function attachFetch(): void {
  if (_attached) return;
  _attached = true;
  _originalFetch = global.fetch;

  global.fetch = async function chuckTSFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const ctx = getInterceptorContext();

    if (!ctx) {
      return _originalFetch!(input, init);
    }

    const id = generateId();
    const timestamp = Date.now();
    const method = (init?.method ?? 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const requestHeaders = headersToRecord(init?.headers);
    const rawBody = init?.body;
    const requestBodyStr = rawBody
      ? safeStringify(rawBody, ctx.config.maxPayloadSize)
      : null;

    const record: HttpRecord = {
      ...(buildPartialRecord({
        id,
        url,
        method,
        requestHeaders,
        requestBody: requestBodyStr,
        requestSize: byteSize(requestBodyStr),
        timestamp,
      }) as HttpRecord),
      id,
      url,
      method,
      requestHeaders,
      requestBody: requestBodyStr,
      requestSize: byteSize(requestBodyStr),
      timestamp,
      responseHeaders: {},
      responseBody: null,
      statusCode: null,
      duration: null,
      responseSize: 0,
      status: 'pending',
      error: null,
      isTimeout: false,
      isCancelled: false,
    };

    ctx.onRequest(record);

    try {
      const response = await _originalFetch!(input, init);
      const duration = Date.now() - timestamp;
      const cloned = response.clone();
      const responseBodyText = await cloned.text().catch(() => null);
      const responseBodyStr = safeStringify(responseBodyText, ctx.config.maxPayloadSize);
      const responseHeaders = headersToRecord(response.headers as unknown as HeadersInit);

      ctx.onUpdate(id, {
        statusCode: response.status,
        responseHeaders,
        responseBody: responseBodyStr,
        responseSize: byteSize(responseBodyStr),
        duration,
        status: response.ok ? 'success' : 'error',
      });

      return response;
    } catch (err: unknown) {
      const duration = Date.now() - timestamp;
      const error = err as Error;
      const isCancelled = error?.name === 'AbortError';
      const isTimeout = error?.name === 'TimeoutError' || error?.message?.includes('timeout');

      ctx.onUpdate(id, {
        duration,
        status: 'error',
        error: error?.message ?? 'Unknown error',
        isCancelled,
        isTimeout,
      });

      throw err;
    }
  };
}

export function detachFetch(): void {
  if (!_attached || !_originalFetch) return;
  global.fetch = _originalFetch;
  _originalFetch = null;
  _attached = false;
}

export function isFetchAttached(): boolean {
  return _attached;
}
