import { useMemo } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useGoals } from "@/lib/goals";
import { usePremium } from "@/lib/iap";

export const FREE_GOAL_LIMIT = 5;
export const WIDGET_TRIAL_DAYS = 7;

export type GoalLimitState = {
  isPro: boolean;
  used: number;
  limit: number;
  canCreate: boolean;
  atLimit: boolean;
};

/**
 * Free users can have up to FREE_GOAL_LIMIT top-level goals (simple or
 * composite). Sub-goals inside a composite are NOT counted — that keeps
 * the limit intuitive ("I created 5 goals") instead of penalizing users
 * who organize goals hierarchically.
 */
export function useGoalLimit(): GoalLimitState {
  const { isPro } = usePremium();
  const { data: goals } = useGoals();
  const used = (goals ?? []).filter((g) => !g.parent_id).length;
  const canCreate = isPro || used < FREE_GOAL_LIMIT;
  return {
    isPro,
    used,
    limit: isPro ? Number.POSITIVE_INFINITY : FREE_GOAL_LIMIT,
    canCreate,
    atLimit: !canCreate,
  };
}

export type WidgetAccessState = {
  hasAccess: boolean;
  trialDaysLeft: number | null;
  expired: boolean;
  isPro: boolean;
};

/**
 * Free users get a WIDGET_TRIAL_DAYS-day trial of home screen widgets,
 * counted from their auth signup. Pro users always have access.
 */
export function useWidgetAccess(): WidgetAccessState {
  const { isPro } = usePremium();
  const { user } = useAuth();

  return useMemo(() => {
    if (isPro) {
      return {
        hasAccess: true,
        trialDaysLeft: null,
        expired: false,
        isPro: true,
      };
    }
    if (!user?.created_at) {
      return {
        hasAccess: false,
        trialDaysLeft: null,
        expired: false,
        isPro: false,
      };
    }
    const signedUpAt = new Date(user.created_at);
    const elapsedDays =
      (Date.now() - signedUpAt.getTime()) / (1000 * 60 * 60 * 24);
    const daysLeft = WIDGET_TRIAL_DAYS - elapsedDays;
    const hasAccess = daysLeft > 0;
    return {
      hasAccess,
      trialDaysLeft: hasAccess ? Math.max(1, Math.ceil(daysLeft)) : 0,
      expired: !hasAccess,
      isPro: false,
    };
  }, [isPro, user?.created_at]);
}
