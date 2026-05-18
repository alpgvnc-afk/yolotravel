import { TripPlan, ActivityBlock } from '../types';

/**
 * Live, viewer-side budget recompute.
 *
 * The cost stored in the plan when it was generated may be stale (currency
 * drift, viewer is in a different country, etc.). This recalculates from the
 * day-by-day activity blocks so the viewer always sees a fresh estimate.
 */

export interface BudgetBreakdown {
  /** Sum of all activity costs across the trip (USD, per-person). */
  activitiesTotal: number;
  /** Food / dining (any block with type 'food'). */
  food: number;
  /** Sightseeing & attractions ('sight'). */
  sights: number;
  /** Misc activities ('activity'). */
  activities: number;
  /** Transport ('transport'). */
  transport: number;
  /** Rest / spa / chill ('rest'). */
  rest: number;
  /** Heuristic accommodation estimate ($120 / night fallback). */
  accommodationEstimate: number;
  /** activitiesTotal + accommodationEstimate. */
  grandTotal: number;
  /** Per-day average for the trip. */
  perDay: number;
  /** How many of the activity blocks actually carried a cost (transparency). */
  countedBlocks: number;
  /** Total blocks scanned, regardless of cost. */
  totalBlocks: number;
}

const DEFAULT_NIGHTLY = 120; // USD — sensible global midrange fallback

const blocks = (plan: TripPlan): ActivityBlock[] =>
  plan.days_plan.flatMap(d => [d.morning, d.afternoon, d.evening]);

export const calculateBudget = (plan: TripPlan): BudgetBreakdown => {
  const all = blocks(plan);
  const bucket = { food: 0, sights: 0, activities: 0, transport: 0, rest: 0 };
  let counted = 0;

  for (const b of all) {
    const c = Number(b.cost) || 0;
    if (c > 0) counted++;
    switch (b.type) {
      case 'food': bucket.food += c; break;
      case 'sight': bucket.sights += c; break;
      case 'activity': bucket.activities += c; break;
      case 'transport': bucket.transport += c; break;
      case 'rest': bucket.rest += c; break;
    }
  }

  const activitiesTotal = bucket.food + bucket.sights + bucket.activities + bucket.transport + bucket.rest;
  const accommodationEstimate = DEFAULT_NIGHTLY * Math.max(1, plan.days);
  const grandTotal = activitiesTotal + accommodationEstimate;
  const perDay = grandTotal / Math.max(1, plan.days);

  return {
    activitiesTotal,
    food: bucket.food,
    sights: bucket.sights,
    activities: bucket.activities,
    transport: bucket.transport,
    rest: bucket.rest,
    accommodationEstimate,
    grandTotal,
    perDay,
    countedBlocks: counted,
    totalBlocks: all.length
  };
};
