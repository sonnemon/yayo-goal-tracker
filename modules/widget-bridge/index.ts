import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

type WidgetBridgeNative = {
  writeGoals: (json: string) => void;
  reloadWidgets: () => void;
};

const native =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<WidgetBridgeNative>("WidgetBridge")
    : null;

if (Platform.OS === "ios") {
  console.log(
    `[widget-bridge] native module ${native ? "LOADED" : "MISSING — rebuild needed"}`
  );
}

export type WidgetGoal = {
  id: string;
  name: string;
  progress: number;
  total: number;
  unit: string;
  icon: string;
};

export function syncGoalsToWidget(goals: WidgetGoal[]): void {
  if (!native) {
    console.log("[widget-bridge] skip sync — native module not loaded");
    return;
  }
  const payload = JSON.stringify({
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      progress: g.progress,
      total: g.total,
      unit: g.unit,
      icon: g.icon,
    })),
  });
  console.log(`[widget-bridge] syncing ${goals.length} goals to widget`);
  native.writeGoals(payload);
  native.reloadWidgets();
}
