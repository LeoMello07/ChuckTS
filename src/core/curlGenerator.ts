import { HttpRecord } from '../types';

export function generateCurl(record: HttpRecord): string {
  const parts: string[] = ['curl'];

  parts.push(`-X ${record.method.toUpperCase()}`);

  const headers = record.requestHeaders ?? {};
  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H '${key}: ${escapeShell(value)}'`);
  }

  if (record.requestBody) {
    parts.push(`-d '${escapeShell(record.requestBody)}'`);
  }

  parts.push(`'${record.url}'`);

  return parts.join(' \\\n  ');
}

function escapeShell(str: string): string {
  return str.replace(/'/g, "'\\''");
}
