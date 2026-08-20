export const planLimits = {
  FREE: {
    templates: 2,
    activePopups: 1,
    mobileCustomization: false,
    advancedAnimations: false,
    pageTargeting: false,
    exitIntent: false,
    analytics: false,
    customCSS: false,
  },
  GROWTH: {
    templates: 5,
    activePopups: 5,
    mobileCustomization: true,
    advancedAnimations: false,
    pageTargeting: true,
    exitIntent: false,
    analytics: false,
    customCSS: false,
  },
  PRO: {
    templates: 10,
    activePopups: 9999,
    mobileCustomization: true,
    advancedAnimations: true,
    pageTargeting: true,
    exitIntent: true,
    analytics: true,
    customCSS: true,
  },
};

export type PlanType = "FREE" | "GROWTH" | "PRO";

export function getEntitlements(plan: PlanType) {
  return planLimits[plan] || planLimits.FREE;
}

export function canCreatePopup(currentActiveCount: number, plan: PlanType) {
  const limits = getEntitlements(plan);
  return currentActiveCount < limits.activePopups;
}
