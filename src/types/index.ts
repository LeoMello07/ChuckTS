export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

export type RequestStatus = 'pending' | 'success' | 'error';

export interface HttpRecord {
  id: string;
  url: string;
  method: HttpMethod | string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  statusCode: number | null;
  duration: number | null;
  timestamp: number;
  requestSize: number;
  responseSize: number;
  status: RequestStatus;
  error: string | null;
  isTimeout: boolean;
  isCancelled: boolean;
}

export interface ChuckTSConfig {
  /** Maximum number of requests to keep in memory. Default: 200 */
  maxRequests: number;
  /** Enable in production builds. Default: false */
  enableInProduction: boolean;
  /** Max payload size (bytes) before truncation. Default: 32768 (32KB) */
  maxPayloadSize: number;
  /** Persist logs to AsyncStorage. Default: false */
  persist: boolean;
}

export type PartialConfig = Partial<ChuckTSConfig>;

export interface FilterState {
  search: string;
  methods: string[];
  statusCodes: string[];
}
