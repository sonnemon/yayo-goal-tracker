import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import {
  formatGoalValue,
  isGoodDelta,
  useGoal,
  useGoalLog,
} from "@/lib/goals";

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  return (
    date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

export default function LogDetailScreen() {
  const { id, logId } = useLocalSearchParams<{ id: string; logId: string }>();
  const { data: log, isLoading: logLoading } = useGoalLog(logId);
  const { data: goal, isLoading: goalLoading } = useGoal(id);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reanimated shared values for swipe-to-close
  const translateY = useSharedValue(0);
  const bgOpacity = useSharedValue(1);

  function closeViewer() {
    setViewerOpen(false);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        bgOpacity.value = interpolate(
          e.translationY,
          [0, 280],
          [1, 0.15],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        translateY.value = withTiming(800, { duration: 220 });
        bgOpacity.value = withTiming(0, { duration: 220 }, (done) => {
          if (done) runOnJS(closeViewer)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        bgOpacity.value = withSpring(1);
      }
    });

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bgAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  // 3-column grid: screen width - 48px padding - 16px gaps
  const thumbSize = Math.floor((width - 64) / 3);

  const isLoading = logLoading || goalLoading;

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-brand-black items-center justify-center"
        edges={["bottom"]}
      >
        <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-brand-black items-center justify-center px-6 gap-3"
        edges={["bottom"]}
      >
        <Text className="font-semibold text-brand-black dark:text-white text-base">
          Log not found.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-brand-green rounded-pill px-6 py-3 active:scale-95"
        >
          <Text className="text-brand-greenDark font-semibold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isAdd = log.amount >= 0;
  const isGood = goal ? isGoodDelta(goal, log.amount) : isAdd;
  const sourceUnit = goal?.unit ?? "";
  const formatted = formatGoalValue(Math.abs(log.amount), sourceUnit);
  const images = log.images ?? [];
  const hasImages = images.length > 0;

  function openViewer(index: number) {
    translateY.value = 0;
    bgOpacity.value = 1;
    setSelectedIndex(index);
    setViewerOpen(true);
  }

  return (
    // Modal presentation already sits below the status bar — only bottom edge needed
    <SafeAreaView
      className="flex-1 bg-white dark:bg-brand-black"
      edges={["bottom"]}
    >
      {/* header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
        >
          <Ionicons name="close" size={22} color={iconColor} />
        </Pressable>
        <Text className="font-semibold text-brand-black dark:text-white text-base">
          Log detail
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerClassName="px-6 pb-6 gap-5">
        {/* amount hero — lineHeight >= fontSize to avoid clipping Inter Black 900 */}
        <View className="gap-2">
          <Text
            className={`font-display ${
              isGood
                ? "text-brand-black dark:text-white"
                : "text-semantic-danger"
            }`}
            style={{ fontSize: 44, lineHeight: 52 }}
          >
            {isAdd ? "+" : "−"}
            {formatted}.
          </Text>
          {goal ? (
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
              {goal.name}
            </Text>
          ) : null}
        </View>

        {/* badges row */}
        <View className="flex-row items-center gap-2 flex-wrap">
          <View
            className={`px-3 py-1 rounded-pill ${
              isGood
                ? "bg-brand-mint dark:bg-brand-greenDark"
                : "bg-semantic-danger/10 dark:bg-semantic-danger/20"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isGood
                  ? "text-brand-greenDark dark:text-brand-green"
                  : "text-semantic-danger"
              }`}
            >
              {isAdd ? "Progress" : "Setback"}
            </Text>
          </View>
          {hasImages ? (
            <View className="flex-row items-center gap-1 px-3 py-1 rounded-pill bg-neutral-lightSurface dark:bg-[#1F221F]">
              <Ionicons
                name="image-outline"
                size={12}
                color={isDark ? "#A6ABA4" : "#454745"}
              />
              <Text className="text-xs font-semibold text-neutral-warmDark dark:text-[#A6ABA4]">
                {images.length} photo{images.length !== 1 ? "s" : ""}
              </Text>
            </View>
          ) : null}
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-xs">
            {formatFullDate(log.created_at)}
          </Text>
        </View>

        {/* note */}
        {log.reason ? (
          <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface p-4 gap-1.5">
            <Text className="text-neutral-gray dark:text-[#6E726B] text-[11px] font-semibold uppercase tracking-wider">
              Note
            </Text>
            <Text className="text-brand-black dark:text-white text-[15px] font-semibold leading-snug">
              {log.reason}
            </Text>
          </View>
        ) : null}

        {/* photo grid */}
        {hasImages ? (
          <View className="gap-3">
            <Text className="text-neutral-gray dark:text-[#6E726B] text-[11px] font-semibold uppercase tracking-wider">
              Photos · {images.length}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {images.map((url, i) => (
                <Pressable
                  key={i}
                  onPress={() => openViewer(i)}
                  className="active:opacity-75"
                  style={{ borderRadius: 10, overflow: "hidden" }}
                >
                  <Image
                    source={{ uri: url }}
                    style={{ width: thumbSize, height: thumbSize }}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* empty state */}
        {!log.reason && !hasImages ? (
          <View className="rounded-token-xl border border-dashed border-brand-black/15 dark:border-white/10 px-4 py-6 items-center gap-1">
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
              No note or photos.
            </Text>
            <Text className="text-neutral-gray dark:text-[#6E726B] text-xs text-center">
              Attach notes and photos when logging progress.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* fullscreen image viewer */}
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={closeViewer}
        statusBarTranslucent
      >
        {/* transparent modal covers status bar → use insets manually */}
        <Animated.View
          style={[{ flex: 1, backgroundColor: "#0e0f0c" }, bgAnimatedStyle]}
        >
          {/* header */}
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingHorizontal: 24,
              paddingBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#6E726B", fontWeight: "600", fontSize: 13 }}>
              {selectedIndex + 1} / {images.length}
            </Text>
            <Pressable
              onPress={closeViewer}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9999,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={18} color="#F5F6F4" />
            </Pressable>
          </View>

          {/* swipeable image */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[{ flex: 1 }, imageAnimatedStyle]}>
              <Image
                source={{ uri: images[selectedIndex] }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </Animated.View>
          </GestureDetector>

          {/* thumbnail strip */}
          <View style={{ paddingBottom: insets.bottom + 8 }}>
            {images.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 12,
                  paddingBottom: 4,
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {images.map((url, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedIndex(i)}
                    style={{ opacity: i === selectedIndex ? 1 : 0.4 }}
                  >
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          i === selectedIndex ? "#9fe870" : "transparent",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={{ height: 12 }} />
            )}
          </View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
