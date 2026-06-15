export const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;

  const numericValue = typeof value === 'string' ? Number(value.trim()) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const formatMoney = (value: unknown, fallback = 0): string => {
  return toFiniteNumber(value, fallback).toFixed(2);
};
