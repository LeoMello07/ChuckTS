import { attachFetch, detachFetch, isFetchAttached } from '../../src/core/fetchInterceptor';
import { setInterceptorContext, getInterceptorContext } from '../../src/core/interceptor';
import { HttpRecord, ChuckTSConfig } from '../../src/types';

const defaultConfig: ChuckTSConfig = {
  maxRequests: 200,
  enableInProduction: false,
  maxPayloadSize: 32768,
  persist: false,
};

function setupContext(onRequest: jest.Mock, onUpdate: jest.Mock) {
  setInterceptorContext({ onRequest, onUpdate, config: defaultConfig });
}

function teardown() {
  detachFetch();
  setInterceptorContext(null);
}

describe('fetchInterceptor', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    teardown();
    global.fetch = originalFetch;
  });

  it('attaches and detaches without error', () => {
    setupContext(jest.fn(), jest.fn());
    attachFetch();
    expect(isFetchAttached()).toBe(true);
    detachFetch();
    expect(isFetchAttached()).toBe(false);
  });

  it('does not attach twice', () => {
    setupContext(jest.fn(), jest.fn());
    attachFetch();
    const patchedFetch = global.fetch;
    attachFetch();
    expect(global.fetch).toBe(patchedFetch);
    detachFetch();
  });

  it('restores original fetch on detach', () => {
    setupContext(jest.fn(), jest.fn());
    attachFetch();
    detachFetch();
    expect(global.fetch).toBe(originalFetch);
  });

  it('calls onRequest when a request is made', async () => {
    const onRequest = jest.fn();
    const onUpdate = jest.fn();
    setupContext(onRequest, onUpdate);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: () => ({
        text: () => Promise.resolve('{"ok":true}'),
      }),
    } as unknown as Response);

    attachFetch();

    await global.fetch('https://example.com/api', { method: 'GET' });

    expect(onRequest).toHaveBeenCalledTimes(1);
    const record: HttpRecord = onRequest.mock.calls[0][0];
    expect(record.url).toBe('https://example.com/api');
    expect(record.method).toBe('GET');
    expect(record.status).toBe('pending');
  });

  it('calls onUpdate with success after response', async () => {
    const onRequest = jest.fn();
    const onUpdate = jest.fn();
    setupContext(onRequest, onUpdate);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      clone: () => ({ text: () => Promise.resolve('response body') }),
    } as unknown as Response);

    attachFetch();
    await global.fetch('https://example.com/data');

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [id, updates] = onUpdate.mock.calls[0];
    expect(typeof id).toBe('string');
    expect(updates.statusCode).toBe(200);
    expect(updates.status).toBe('success');
  });

  it('calls onUpdate with error status for 4xx', async () => {
    const onRequest = jest.fn();
    const onUpdate = jest.fn();
    setupContext(onRequest, onUpdate);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      clone: () => ({ text: () => Promise.resolve('not found') }),
    } as unknown as Response);

    attachFetch();
    await global.fetch('https://example.com/missing');

    const [, updates] = onUpdate.mock.calls[0];
    expect(updates.status).toBe('error');
    expect(updates.statusCode).toBe(404);
  });

  it('marks isCancelled=true on AbortError', async () => {
    const onRequest = jest.fn();
    const onUpdate = jest.fn();
    setupContext(onRequest, onUpdate);

    const abortError = new DOMException('Aborted', 'AbortError');
    global.fetch = jest.fn().mockRejectedValue(abortError);

    attachFetch();

    await expect(global.fetch('https://example.com/cancel')).rejects.toThrow();

    const [, updates] = onUpdate.mock.calls[0];
    expect(updates.status).toBe('error');
    expect(updates.isCancelled).toBe(true);
  });

  it('passes through when no context is set', async () => {
    setInterceptorContext(null);
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      clone: () => ({ text: () => Promise.resolve('') }),
    } as unknown as Response);

    global.fetch = mockFetch;
    attachFetch();

    await global.fetch('https://example.com');

    // The underlying fetch should still be called
    expect(mockFetch).toHaveBeenCalled();
  });
});
