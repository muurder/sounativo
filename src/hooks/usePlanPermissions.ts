import { useMemo } from 'react';
import { PlanTier } from '@/types';
import { getPlanPermissions } from '@/utils/planPermissions';

export function usePlanPermissions(plan: PlanTier = 'STARTER', activeTripsCount = 0) {
  return useMemo(() => getPlanPermissions(plan, activeTripsCount), [activeTripsCount, plan]);
}
