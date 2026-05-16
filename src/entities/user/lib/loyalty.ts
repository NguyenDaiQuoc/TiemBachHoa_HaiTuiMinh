import { formatCurrencyVND } from '@/src/shared/lib/utils';

export interface LoyaltyTier {
  name: string;
  color: string;
  bg: string;
  border: string;
  minPoints: number;
  maxPoints: number;
}

export const TIERS: LoyaltyTier[] = [
  { name: 'Đồng', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', minPoints: 0, maxPoints: 49 },
  { name: 'Bạc', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', minPoints: 50, maxPoints: 199 },
  { name: 'Vàng', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', minPoints: 200, maxPoints: 499 },
  { name: 'Bạch kim', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', minPoints: 500, maxPoints: Number.POSITIVE_INFINITY },
];

const SPEND_PER_POINT = 10_000;
const SAVING_RATE = 0.068;

export const pointsToSpend = (points: number) => points * SPEND_PER_POINT;
export const estimateSavingsFromPoints = (points: number) => Math.round(pointsToSpend(points) * SAVING_RATE);

export const getTierSpendRange = (tier: LoyaltyTier) => {
  const minSpend = pointsToSpend(tier.minPoints);
  const maxSpend = Number.isFinite(tier.maxPoints) ? pointsToSpend(tier.maxPoints) : null;

  return maxSpend === null
    ? `Từ ${formatCurrencyVND(minSpend)}`
    : `${formatCurrencyVND(minSpend)} - ${formatCurrencyVND(maxSpend)}`;
};

export const calculateLoyalty = (points = 0) => {
  const currentTierIndex = TIERS.findIndex((tier) => points >= tier.minPoints && points <= tier.maxPoints);
  const tierIndex = currentTierIndex === -1 ? 0 : currentTierIndex;
  const currentTier = TIERS[tierIndex];
  const nextTier = TIERS[tierIndex + 1] || null;

  const progress = nextTier
    ? Math.min(
        100,
        Math.max(0, ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)
      )
    : 100;

  return {
    points,
    estimatedSpend: pointsToSpend(points),
    estimatedSavings: estimateSavingsFromPoints(points),
    currentTier,
    nextTier,
    progress,
    tierIndex,
    pointsToNextTier: nextTier ? Math.max(0, nextTier.minPoints - points) : 0,
  };
};
