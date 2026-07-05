const isAbsoluteMediaUrl = (value: string) => /^(data:|blob:|https?:\/\/|\/\/)/i.test(value);

export const normalizeMediaSrc = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;

  const trimmed = src.trim();
  if (!trimmed) return null;
  if (isAbsoluteMediaUrl(trimmed)) return trimmed;

  const basePath = import.meta.env.BASE_URL || '/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const cleaned = trimmed.replace(/^\.\//, '').replace(/^\//, '');

  return `${normalizedBase}${cleaned}`;
};
