export const colors = {
  bg: '#0d1117',
  bgCard: '#161b22',
  bgCardHover: '#1c2128',
  bgInput: '#21262d',
  border: '#30363d',
  borderActive: '#388bfd',
  text: '#e6edf3',
  textMuted: '#8b949e',
  textFaint: '#484f58',

  success: '#3fb950',
  successBg: '#1b3a26',
  error: '#f85149',
  errorBg: '#3d1a1a',
  warning: '#d29922',
  warningBg: '#3a2f10',
  info: '#388bfd',
  infoBg: '#1c2e4a',

  methodGet: '#3fb950',
  methodPost: '#388bfd',
  methodPut: '#d29922',
  methodPatch: '#a371f7',
  methodDelete: '#f85149',
  methodOther: '#8b949e',

  jsonKey: '#79c0ff',
  jsonString: '#a5d6ff',
  jsonNumber: '#f0883e',
  jsonBoolean: '#ff7b72',
  jsonNull: '#8b949e',
  jsonBracket: '#e6edf3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 999,
};

export const font = {
  mono: 'Courier',
  sans: 'System',
  size: {
    xs: 10,
    sm: 12,
    md: 13,
    lg: 15,
    xl: 17,
  },
};

export function methodColor(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET': return colors.methodGet;
    case 'POST': return colors.methodPost;
    case 'PUT': return colors.methodPut;
    case 'PATCH': return colors.methodPatch;
    case 'DELETE': return colors.methodDelete;
    default: return colors.methodOther;
  }
}

export function statusColor(code: number | null): string {
  if (!code) return colors.textMuted;
  if (code < 300) return colors.success;
  if (code < 400) return colors.warning;
  return colors.error;
}

export function statusBg(code: number | null): string {
  if (!code) return colors.bgCard;
  if (code < 300) return colors.successBg;
  if (code < 400) return colors.warningBg;
  return colors.errorBg;
}
