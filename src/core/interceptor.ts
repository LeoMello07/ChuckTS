import { HttpRecord, ChuckTSConfig } from '../types';

export type RecordHandler = (record: HttpRecord) => void;
export type UpdateHandler = (id: string, updates: Partial<HttpRecord>) => void;

export interface InterceptorContext {
  onRequest: RecordHandler;
  onUpdate: UpdateHandler;
  config: ChuckTSConfig;
}

let _context: InterceptorContext | null = null;

export function setInterceptorContext(ctx: InterceptorContext | null): void {
  _context = ctx;
}

export function getInterceptorContext(): InterceptorContext | null {
  return _context;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
