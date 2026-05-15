import {
  safeStringify,
  headersToRecord,
  byteSize,
  parseResponseBody,
  isJsonContentType,
} from '../../src/core/serializer';

describe('safeStringify', () => {
  it('returns null for null input', () => {
    expect(safeStringify(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(safeStringify(undefined)).toBeNull();
  });

  it('stringifies a plain object', () => {
    const result = safeStringify({ foo: 'bar' });
    expect(result).toBe('{"foo":"bar"}');
  });

  it('returns string as-is when under limit', () => {
    const str = 'hello world';
    expect(safeStringify(str)).toBe(str);
  });

  it('truncates strings exceeding maxSize', () => {
    const long = 'a'.repeat(100);
    const result = safeStringify(long, 10);
    expect(result).not.toBeNull();
    expect(result!.startsWith('aaaaaaaaaa')).toBe(true);
    expect(result!).toContain('[ChuckTS] Truncated');
  });

  it('returns fallback string for non-serializable circular object', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    const result = safeStringify(obj);
    expect(result).toBe('[ChuckTS] Could not serialize body');
  });

  it('stringifies arrays', () => {
    expect(safeStringify([1, 2, 3])).toBe('[1,2,3]');
  });

  it('stringifies booleans and numbers', () => {
    expect(safeStringify(true)).toBe('true');
    expect(safeStringify(42)).toBe('42');
  });
});

describe('headersToRecord', () => {
  it('returns empty object for undefined', () => {
    expect(headersToRecord(undefined)).toEqual({});
  });

  it('converts plain object headers', () => {
    const result = headersToRecord({ 'Content-Type': 'application/json' });
    expect(result).toEqual({ 'Content-Type': 'application/json' });
  });

  it('converts array of tuples', () => {
    const result = headersToRecord([['Authorization', 'Bearer token']]);
    expect(result).toEqual({ Authorization: 'Bearer token' });
  });

  it('converts Headers instance', () => {
    const headers = new Headers();
    headers.set('x-custom', 'value');
    const result = headersToRecord(headers as unknown as HeadersInit);
    expect(result['x-custom']).toBe('value');
  });
});

describe('byteSize', () => {
  it('returns 0 for null', () => {
    expect(byteSize(null)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(byteSize('')).toBe(0);
  });

  it('returns correct byte length for ASCII', () => {
    expect(byteSize('hello')).toBe(5);
  });

  it('returns correct byte length for UTF-8 multibyte', () => {
    // '€' is 3 bytes in UTF-8
    expect(byteSize('€')).toBe(3);
  });
});

describe('parseResponseBody', () => {
  it('returns null for null body', () => {
    expect(parseResponseBody(null, 'application/json')).toBeNull();
  });

  it('pretty-prints valid JSON body when content-type is json', () => {
    const input = '{"a":1}';
    const result = parseResponseBody(input, 'application/json');
    expect(result).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('returns body as-is for non-JSON content type', () => {
    const input = '<html></html>';
    expect(parseResponseBody(input, 'text/html')).toBe(input);
  });

  it('returns raw body if JSON parse fails despite json content-type', () => {
    const malformed = '{bad json}';
    expect(parseResponseBody(malformed, 'application/json')).toBe(malformed);
  });
});

describe('isJsonContentType', () => {
  it('returns true for application/json', () => {
    expect(isJsonContentType('application/json')).toBe(true);
  });

  it('returns true for application/json; charset=utf-8', () => {
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
  });

  it('returns true for text/json', () => {
    expect(isJsonContentType('text/json')).toBe(true);
  });

  it('returns false for text/html', () => {
    expect(isJsonContentType('text/html')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isJsonContentType(undefined)).toBe(false);
  });
});
