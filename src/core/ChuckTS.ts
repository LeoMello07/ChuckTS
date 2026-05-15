import type { AxiosInstance } from 'axios';
import { ChuckTSConfig, HttpRecord, PartialConfig } from '../types';
import { setInterceptorContext } from './interceptor';
import { attachFetch, detachFetch, isFetchAttached } from './fetchInterceptor';
import { attachAxios, detachAxios } from './axiosInterceptor';
import { useChuckTSStore } from '../store';

const DEFAULT_CONFIG: ChuckTSConfig = {
  maxRequests: 200,
  enableInProduction: false,
  maxPayloadSize: 32768,
  persist: false,
};

class ChuckTSClass {
  private _config: ChuckTSConfig = { ...DEFAULT_CONFIG };
  private _started = false;
  private _axiosInstances: AxiosInstance[] = [];

  get config(): ChuckTSConfig {
    return { ...this._config };
  }

  get isStarted(): boolean {
    return this._started;
  }

  /**
   * Initialise ChuckTS. Call once at app startup.
   */
  start(config?: PartialConfig): void {
    const isDev = __DEV__;

    if (!isDev && !config?.enableInProduction) {
      return;
    }

    this._config = { ...DEFAULT_CONFIG, ...config };
    this._started = true;

    useChuckTSStore.getState().setMaxRequests(this._config.maxRequests);

    setInterceptorContext({
      onRequest: (record: HttpRecord) => {
        useChuckTSStore.getState().addRecord(record);
      },
      onUpdate: (id: string, updates: Partial<HttpRecord>) => {
        useChuckTSStore.getState().updateRecord(id, updates);
      },
      config: this._config,
    });
  }

  /**
   * Stop all interception and clear state.
   */
  stop(): void {
    if (!this._started) return;

    detachFetch();
    this._axiosInstances.forEach((instance) => detachAxios(instance));
    this._axiosInstances = [];

    setInterceptorContext(null);
    this._started = false;
  }

  /**
   * Intercept the global fetch function.
   */
  attachFetch(): void {
    if (!this._started) {
      console.warn('[ChuckTS] Call ChuckTS.start() before attachFetch()');
      return;
    }
    attachFetch();
  }

  /**
   * Intercept an Axios instance.
   */
  attachAxios(instance: AxiosInstance): void {
    if (!this._started) {
      console.warn('[ChuckTS] Call ChuckTS.start() before attachAxios()');
      return;
    }
    attachAxios(instance);
    if (!this._axiosInstances.includes(instance)) {
      this._axiosInstances.push(instance);
    }
  }

  /**
   * Remove fetch interceptor without stopping ChuckTS.
   */
  detachFetch(): void {
    detachFetch();
  }

  /**
   * Remove axios interceptor for a specific instance.
   */
  detachAxios(instance: AxiosInstance): void {
    detachAxios(instance);
    this._axiosInstances = this._axiosInstances.filter((i) => i !== instance);
  }

  /**
   * Open the inspector panel programmatically.
   */
  open(): void {
    useChuckTSStore.getState().setVisible(true);
  }

  /**
   * Close the inspector panel.
   */
  close(): void {
    useChuckTSStore.getState().setVisible(false);
  }

  /**
   * Toggle the inspector panel.
   */
  toggle(): void {
    useChuckTSStore.getState().toggleVisible();
  }

  /**
   * Clear all stored requests.
   */
  clear(): void {
    useChuckTSStore.getState().clearRecords();
  }

  /**
   * Returns all stored records.
   */
  getRecords(): HttpRecord[] {
    return useChuckTSStore.getState().records;
  }

  /**
   * Export all records as JSON string.
   */
  exportLogs(): string {
    const records = this.getRecords();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '0.1.0',
        records,
      },
      null,
      2
    );
  }

  /**
   * Import records from a previously exported JSON string.
   */
  importLogs(json: string): void {
    try {
      const parsed = JSON.parse(json) as { records?: HttpRecord[] };
      const records = parsed?.records ?? [];
      const store = useChuckTSStore.getState();
      records.forEach((r) => store.addRecord(r));
    } catch {
      console.warn('[ChuckTS] Failed to import logs — invalid JSON');
    }
  }

  /**
   * Returns true if the inspector panel is visible.
   */
  get isVisible(): boolean {
    return useChuckTSStore.getState().isVisible;
  }

  /** Whether fetch is currently intercepted. */
  get isFetchAttached(): boolean {
    return isFetchAttached();
  }
}

export const ChuckTS = new ChuckTSClass();
