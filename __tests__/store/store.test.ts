import { useChuckTSStore, getFilteredRecords } from '../../src/store';
import { HttpRecord, FilterState } from '../../src/types';

function makeRecord(overrides: Partial<HttpRecord> = {}): HttpRecord {
  return {
    id: `id-${Math.random()}`,
    url: 'https://api.example.com/test',
    method: 'GET',
    requestHeaders: {},
    requestBody: null,
    responseHeaders: {},
    responseBody: null,
    statusCode: 200,
    duration: 50,
    timestamp: Date.now(),
    requestSize: 0,
    responseSize: 100,
    status: 'success',
    error: null,
    isTimeout: false,
    isCancelled: false,
    ...overrides,
  };
}

describe('ChuckTS store', () => {
  beforeEach(() => {
    useChuckTSStore.getState().clearRecords();
    useChuckTSStore.getState().resetFilter();
  });

  it('adds records in reverse chronological order', () => {
    const r1 = makeRecord({ id: 'a' });
    const r2 = makeRecord({ id: 'b' });
    useChuckTSStore.getState().addRecord(r1);
    useChuckTSStore.getState().addRecord(r2);
    const { records } = useChuckTSStore.getState();
    expect(records[0].id).toBe('b');
    expect(records[1].id).toBe('a');
  });

  it('caps records at maxRequests', () => {
    useChuckTSStore.getState().setMaxRequests(3);
    for (let i = 0; i < 5; i++) {
      useChuckTSStore.getState().addRecord(makeRecord({ id: `r${i}` }));
    }
    expect(useChuckTSStore.getState().records.length).toBe(3);
  });

  it('updates a record by id', () => {
    const r = makeRecord({ id: 'update-me', status: 'pending' });
    useChuckTSStore.getState().addRecord(r);
    useChuckTSStore.getState().updateRecord('update-me', { status: 'success', statusCode: 200 });
    const updated = useChuckTSStore.getState().records.find((x) => x.id === 'update-me');
    expect(updated?.status).toBe('success');
    expect(updated?.statusCode).toBe(200);
  });

  it('clears all records', () => {
    useChuckTSStore.getState().addRecord(makeRecord());
    useChuckTSStore.getState().clearRecords();
    expect(useChuckTSStore.getState().records.length).toBe(0);
    expect(useChuckTSStore.getState().selectedId).toBeNull();
  });

  it('toggles visibility', () => {
    expect(useChuckTSStore.getState().isVisible).toBe(false);
    useChuckTSStore.getState().toggleVisible();
    expect(useChuckTSStore.getState().isVisible).toBe(true);
    useChuckTSStore.getState().toggleVisible();
    expect(useChuckTSStore.getState().isVisible).toBe(false);
  });

  it('selects and deselects records', () => {
    useChuckTSStore.getState().selectRecord('abc');
    expect(useChuckTSStore.getState().selectedId).toBe('abc');
    useChuckTSStore.getState().selectRecord(null);
    expect(useChuckTSStore.getState().selectedId).toBeNull();
  });
});

describe('getFilteredRecords', () => {
  const records: HttpRecord[] = [
    makeRecord({ id: '1', url: 'https://api.example.com/users', method: 'GET', statusCode: 200 }),
    makeRecord({ id: '2', url: 'https://api.example.com/orders', method: 'POST', statusCode: 201 }),
    makeRecord({ id: '3', url: 'https://api.example.com/error', method: 'DELETE', statusCode: 500 }),
    makeRecord({ id: '4', url: 'https://other.io/health', method: 'GET', statusCode: 200 }),
  ];

  const emptyFilter: FilterState = { search: '', methods: [], statusCodes: [] };

  it('returns all records when no filter is applied', () => {
    expect(getFilteredRecords(records, emptyFilter)).toHaveLength(4);
  });

  it('filters by URL search', () => {
    const result = getFilteredRecords(records, { ...emptyFilter, search: 'example.com' });
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.url.includes('example.com'))).toBe(true);
  });

  it('filters by method', () => {
    const result = getFilteredRecords(records, { ...emptyFilter, methods: ['GET'] });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.method === 'GET')).toBe(true);
  });

  it('filters by multiple methods', () => {
    const result = getFilteredRecords(records, { ...emptyFilter, methods: ['GET', 'POST'] });
    expect(result).toHaveLength(3);
  });

  it('filters by status code group (5xx)', () => {
    const result = getFilteredRecords(records, { ...emptyFilter, statusCodes: ['5xx'] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters by status code group (2xx)', () => {
    const result = getFilteredRecords(records, { ...emptyFilter, statusCodes: ['2xx'] });
    expect(result).toHaveLength(3);
  });

  it('combines search and method filters', () => {
    const result = getFilteredRecords(records, {
      search: 'example.com',
      methods: ['GET'],
      statusCodes: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
