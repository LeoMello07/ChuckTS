import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { HttpRecord } from '../types';
import { safeStringify, headersToRecord, byteSize } from './serializer';
import { generateId, getInterceptorContext } from './interceptor';

const REQUEST_TIMESTAMP_KEY = '__chuckts_start__';
const REQUEST_ID_KEY = '__chuckts_id__';

interface AxiosEjectHandles {
  requestId: number;
  responseId: number;
}

const _instanceHandles = new WeakMap<AxiosInstance, AxiosEjectHandles>();

export function attachAxios(instance: AxiosInstance): void {
  if (_instanceHandles.has(instance)) return;

  const requestId = instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const ctx = getInterceptorContext();
      if (!ctx) return config;

      const id = generateId();
      const timestamp = Date.now();
      const method = (config.method ?? 'GET').toUpperCase();
      const url = buildFullUrl(config);
      const requestHeaders = headersToRecord(config.headers as unknown as HeadersInit);
      const bodyStr = config.data
        ? safeStringify(config.data, ctx.config.maxPayloadSize)
        : null;

      const record: HttpRecord = {
        id,
        url,
        method,
        requestHeaders,
        requestBody: bodyStr,
        requestSize: byteSize(bodyStr),
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

      (config as Record<string, unknown>)[REQUEST_TIMESTAMP_KEY] = timestamp;
      (config as Record<string, unknown>)[REQUEST_ID_KEY] = id;

      return config;
    }
  );

  const responseId = instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const ctx = getInterceptorContext();
      if (!ctx) return response;

      const config = response.config as Record<string, unknown>;
      const id = config[REQUEST_ID_KEY] as string | undefined;
      const startTime = config[REQUEST_TIMESTAMP_KEY] as number | undefined;
      if (!id || !startTime) return response;

      const duration = Date.now() - startTime;
      const responseHeaders = headersToRecord(
        response.headers as unknown as HeadersInit
      );
      const bodyStr = safeStringify(response.data, ctx.config.maxPayloadSize);

      ctx.onUpdate(id, {
        statusCode: response.status,
        responseHeaders,
        responseBody: bodyStr,
        responseSize: byteSize(bodyStr),
        duration,
        status: response.status >= 400 ? 'error' : 'success',
      });

      return response;
    },
    (error: unknown) => {
      const ctx = getInterceptorContext();
      if (!ctx) return Promise.reject(error);

      const axiosError = error as {
        config?: Record<string, unknown>;
        response?: AxiosResponse;
        message?: string;
        code?: string;
      };

      const config = axiosError?.config ?? {};
      const id = config[REQUEST_ID_KEY] as string | undefined;
      const startTime = config[REQUEST_TIMESTAMP_KEY] as number | undefined;

      if (id && startTime) {
        const duration = Date.now() - startTime;
        const isCancelled = axiosError?.code === 'ERR_CANCELED';
        const isTimeout = axiosError?.code === 'ECONNABORTED';

        ctx.onUpdate(id, {
          statusCode: axiosError?.response?.status ?? null,
          duration,
          status: 'error',
          error: axiosError?.message ?? 'Unknown error',
          isCancelled,
          isTimeout,
        });
      }

      return Promise.reject(error);
    }
  );

  _instanceHandles.set(instance, { requestId, responseId });
}

export function detachAxios(instance: AxiosInstance): void {
  const handles = _instanceHandles.get(instance);
  if (!handles) return;

  instance.interceptors.request.eject(handles.requestId);
  instance.interceptors.response.eject(handles.responseId);
  _instanceHandles.delete(instance);
}

function buildFullUrl(config: InternalAxiosRequestConfig): string {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  const params = config.params
    ? '?' + new URLSearchParams(config.params as Record<string, string>).toString()
    : '';

  if (url.startsWith('http')) return url + params;
  return (base + url + params).replace(/([^:])\/\//g, '$1/');
}
