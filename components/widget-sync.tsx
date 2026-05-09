import { useEffect } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useGoals } from "@/lib/goals";
import { syncGoalsToWidget } from "../modules/widget-bridge";

export function WidgetSync() {
  const { user } = useAuth();
  const { data } = useGoals();

  useEffect(() => {
    if (!user) {
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
          unit: g.unit,
          icon: g.icon,
        }));
      syncGoalsToWidget(widgetGoals);
    }
  }, [user, data]);

  return null;
}
