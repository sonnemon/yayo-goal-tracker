import { useEffect } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useWidgetAccess } from "@/lib/entitlements";
import { useGoals } from "@/lib/goals";
import { syncGoalsToWidget } from "../modules/widget-bridge";

export function WidgetSync() {
  const { user } = useAuth();
  const { data } = useGoals();
  const { hasAccess } = useWidgetAccess();

  useEffect(() => {
    // No user, or free user past their 7-day trial → clear the widget so
    // it stops showing stale progress data.
    if (!user || !hasAccess) {
      syncGoalsToWidget([]);
      return;
    }
    if (data) {
      const widgetGoals = data
        .filter(
          (g) => g.kind === "simple" && g.total != null && g.progress != null
        )
        .map((g) => ({
          id: g.id,
          name: g.name,
          progress: g.progress as number,
          total: g.total as number,
          start: g.start,
          unit: g.unit,
          icon: g.icon,
        }));
      syncGoalsToWidget(widgetGoals);
    }
  }, [user, data, hasAccess]);

  return null;
}
