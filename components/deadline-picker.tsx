import DateTimePicker from "@react-native-community/datetimepicker";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const PRESETS = [
  { id: "today", label: "Today", days: 0 },
  { id: "tomorrow", label: "Tomorrow", days: 1 },
  { id: "week", label: "1 week", days: 7 },
  { id: "month", label: "1 month", days: 30 },
];

function PresetBadge({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3.5 py-2 rounded-pill border active:scale-95 ${
        active
          ? "bg-brand-green border-brand-green"
          : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
      }`}
    >
      <Text
        className={`font-semibold text-sm ${
          active ? "text-brand-greenDark" : "text-brand-black dark:text-white"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DeadlinePicker({ value, onChange }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const today = startOfToday();

  const matchingPresetId = value
    ? PRESETS.find((p) => isSameDay(addDays(today, p.days), value))?.id ?? null
    : null;

  return (
    <View className="flex-row flex-wrap gap-2 items-center">
      <PresetBadge
        label="—"
        active={value === null}
        onPress={() => onChange(null)}
      />
      {PRESETS.map((p) => (
        <PresetBadge
          key={p.id}
          label={p.label}
          active={matchingPresetId === p.id}
          onPress={() => onChange(addDays(today, p.days))}
        />
      ))}
      <DateTimePicker
        value={value ?? today}
        mode="date"
        display="compact"
        minimumDate={today}
        accentColor="#163300"
        themeVariant={isDark ? "dark" : "light"}
        onChange={(_, date) => {
          if (date) onChange(date);
        }}
      />
    </View>
  );
}
