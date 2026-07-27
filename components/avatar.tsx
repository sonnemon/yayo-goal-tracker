import { Image, Pressable, Text, View } from "react-native";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  onPress?: () => void;
};

const wrapperSize = {
  sm: "w-9 h-9",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const textSize = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

function getInitials(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function Avatar({ name, imageUrl, size = "md", onPress }: Props) {
  const initials = getInitials(name);
  const hasImage = !!imageUrl;

  const circle = (
    <View
      className={`${wrapperSize[size]} rounded-pill bg-brand-mint items-center justify-center overflow-hidden`}
    >
      {hasImage ? (
        <Image
          source={{ uri: imageUrl as string }}
          className={`${wrapperSize[size]}`}
          resizeMode="cover"
        />
      ) : (
        <Text
          className={`font-semibold text-brand-greenDark ${textSize[size]}`}
        >
          {initials}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:scale-95 self-start">
        {circle}
      </Pressable>
    );
  }
  return circle;
}
