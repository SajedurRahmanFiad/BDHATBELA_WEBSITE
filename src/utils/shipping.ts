import { toFiniteNumber } from './money';

interface DynamicShippingSettings {
  enabled?: boolean;
  perKgCharge?: number;
  startKg?: number;
  discrete?: boolean;
}

export const calculateDynamicShippingCharge = (
  totalWeight: unknown,
  settings?: DynamicShippingSettings | null,
): number => {
  if (settings?.enabled !== true) return 0;

  const extraWeight = Math.max(
    toFiniteNumber(totalWeight) - toFiniteNumber(settings.startKg),
    0,
  );
  const chargeableWeight = settings.discrete ? Math.ceil(extraWeight) : extraWeight;
  return chargeableWeight * toFiniteNumber(settings.perKgCharge);
};