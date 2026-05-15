import { generateCurl } from '../../src/core/curlGenerator';
import { HttpRecord } from '../../src/types';

function makeRecord(overrides: Partial<HttpRecord> = {}): HttpRecord {
  return {
    id: 'test-id',
    url: 'https://api.example.com/users',
    method: 'GET',
    requestHeaders: {},
    requestBody: null,
    responseHeaders: {},
    responseBody: null,
    statusCode: 200,
    duration: 123,
    timestamp: Date.now(),
    requestSize: 0,
    responseSize: 0,
    status: 'success',
    error: null,
    isTimeout: false,
    isCancelled: false,
    ...overrides,
  };
}

describe('generateCurl', () => {
  it('generates a basic GET request', () => {
    const curl = generateCurl(makeRecord());
    expect(curl).toContain("curl");
    expect(curl).toContain("-X GET");
    expect(curl).toContain("'https://api.example.com/users'");
  });

  it('includes headers', () => {
    const curl = generateCurl(
      makeRecord({
        requestHeaders: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
      })
    );
    expect(curl).toContain("-H 'Authorization: Bearer token123'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
  });

  it('includes request body for POST', () => {
    const curl = generateCurl(
      makeRecord({
        method: 'POST',
        requestBody: '{"name":"John"}',
        requestHeaders: { 'Content-Type': 'application/json' },
      })
    );
    expect(curl).toContain("-X POST");
    expect(curl).toContain("-d '{\"name\":\"John\"}'");
  });

  it('escapes single quotes in header values', () => {
    const curl = generateCurl(
      makeRecord({
        requestHeaders: { 'X-Custom': "it's here" },
      })
    );
    expect(curl).toContain("it'\\''s here");
  });

  it('escapes single quotes in body', () => {
    const curl = generateCurl(
      makeRecord({
        method: 'POST',
        requestBody: "it's a test",
      })
    );
    expect(curl).toContain("-d 'it'\\''s a test'");
  });

  it('omits -d flag when body is null', () => {
    const curl = generateCurl(makeRecord({ requestBody: null }));
    expect(curl).not.toContain('-d');
  });

  it('handles DELETE method', () => {
    const curl = generateCurl(makeRecord({ method: 'DELETE' }));
    expect(curl).toContain('-X DELETE');
  });

  it('produces multi-line output with backslash continuation', () => {
    const curl = generateCurl(
      makeRecord({
        requestHeaders: { Authorization: 'Bearer x' },
      })
    );
    expect(curl).toContain('\\\n');
  });
});
