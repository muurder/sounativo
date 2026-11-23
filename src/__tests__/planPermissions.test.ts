import { describe, expect, it } from 'vitest';
import { getPlanPermissions } from '@/utils/planPermissions';

describe('getPlanPermissions', () => {
  it('enforces STARTER 2-trip active limit and restricts theme customization', () => {
    const under = getPlanPermissions('STARTER', 1);
    const atLimit = getPlanPermissions('STARTER', 2);

    expect(under.canPublishMoreTrips).toBe(true);
    expect(atLimit.canPublishMoreTrips).toBe(false);
    expect(under.canCustomizeTheme).toBe(false);
    expect(under.canAccessOperationalTools).toBe(false);
  });

  it('grants theme and operational access appropriately on BASIC and PREMIUM', () => {
    const basicUnder = getPlanPermissions('BASIC', 4);
    const basicAtLimit = getPlanPermissions('BASIC', 5);
    const premium = getPlanPermissions('PREMIUM', 50);

    expect(basicUnder.canCustomizeTheme).toBe(true);
    expect(basicUnder.canAccessOperationalTools).toBe(false);
    expect(basicUnder.canPublishMoreTrips).toBe(true);
    expect(basicAtLimit.canPublishMoreTrips).toBe(false);
    expect(premium.canPublishMoreTrips).toBe(true);
    expect(premium.canAccessOperationalTools).toBe(true);
  });

  it('downgrades non-STARTER permissions to STARTER when subscriptionStatus is PENDING or INACTIVE', () => {
    const pendingPremium = getPlanPermissions('PREMIUM', 2, 'PENDING');
    const inactiveBasic = getPlanPermissions('BASIC', 1, 'INACTIVE');
    const activeStarter = getPlanPermissions('STARTER', 1, 'ACTIVE');

    expect(pendingPremium.canPublishMoreTrips).toBe(false);
    expect(pendingPremium.canCustomizeTheme).toBe(false);
    expect(pendingPremium.canAccessOperationalTools).toBe(false);

    expect(inactiveBasic.canPublishMoreTrips).toBe(true);
    expect(inactiveBasic.maxTrips).toBe(2);
    expect(inactiveBasic.canCustomizeTheme).toBe(false);

    expect(activeStarter.canPublishMoreTrips).toBe(true);
  });
});
