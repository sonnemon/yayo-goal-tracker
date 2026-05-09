import {
  Activity,
  Apple,
  Beer,
  Bell,
  Bike,
  Book,
  Briefcase,
  Cake,
  Camera,
  Car,
  Clock,
  Coffee,
  Cookie,
  CreditCard,
  DollarSign,
  Droplet,
  Dumbbell,
  FileText,
  Flag,
  Flame,
  Footprints,
  Gem,
  Gift,
  Heart,
  Home,
  IceCream,
  Leaf,
  Library,
  Medal,
  Mountain,
  Music,
  PiggyBank,
  Pizza,
  Plane,
  Salad,
  Sandwich,
  Snowflake,
  Soup,
  Sparkles,
  Star,
  Sun,
  Target,
  Tent,
  Trophy,
  Volleyball,
  Wallet,
  Waves,
  Wine,
  type LucideProps,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";

type IconComponent = ComponentType<LucideProps>;

export const ICONS: Record<string, IconComponent> = {
  // sports
  trophy: Trophy,
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  target: Target,
  mountain: Mountain,
  waves: Waves,
  medal: Medal,
  volleyball: Volleyball,
  activity: Activity,
  tent: Tent,
  snowflake: Snowflake,
  // food
  coffee: Coffee,
  droplet: Droplet,
  apple: Apple,
  pizza: Pizza,
  cake: Cake,
  salad: Salad,
  cookie: Cookie,
  beer: Beer,
  "ice-cream": IceCream,
  wine: Wine,
  sandwich: Sandwich,
  soup: Soup,
  // life
  heart: Heart,
  book: Book,
  library: Library,
  "file-text": FileText,
  clock: Clock,
  flame: Flame,
  leaf: Leaf,
  plane: Plane,
  home: Home,
  car: Car,
  music: Music,
  camera: Camera,
  // others
  flag: Flag,
  wallet: Wallet,
  "dollar-sign": DollarSign,
  gem: Gem,
  "credit-card": CreditCard,
  sparkles: Sparkles,
  briefcase: Briefcase,
  gift: Gift,
  "piggy-bank": PiggyBank,
  star: Star,
  sun: Sun,
  bell: Bell,
};

export const ICON_OPTIONS = Object.keys(ICONS);
export const DEFAULT_ICON = "flag";

export const ICON_CATEGORIES = {
  sports: [
    "trophy",
    "dumbbell",
    "footprints",
    "bike",
    "target",
    "mountain",
    "waves",
    "medal",
    "volleyball",
    "activity",
    "tent",
    "snowflake",
  ],
  food: [
    "coffee",
    "droplet",
    "apple",
    "pizza",
    "cake",
    "salad",
    "cookie",
    "beer",
    "ice-cream",
    "wine",
    "sandwich",
    "soup",
  ],
  life: [
    "heart",
    "book",
    "library",
    "file-text",
    "clock",
    "flame",
    "leaf",
    "plane",
    "home",
    "car",
    "music",
    "camera",
  ],
  others: [
    "flag",
    "wallet",
    "dollar-sign",
    "gem",
    "credit-card",
    "sparkles",
    "briefcase",
    "gift",
    "piggy-bank",
    "star",
    "sun",
    "bell",
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconCategory = keyof typeof ICON_CATEGORIES;

export function getIconCategory(icon: string): IconCategory {
  for (const cat of Object.keys(ICON_CATEGORIES) as IconCategory[]) {
    if ((ICON_CATEGORIES[cat] as readonly string[]).includes(icon)) return cat;
  }
  return "life";
}

const ICON_TAGS: Record<string, string[]> = {
  // sports
  trophy: ["win", "premio", "logro", "achievement", "compete"],
  dumbbell: ["gym", "workout", "lift", "ejercicio", "pesas", "fit"],
  footprints: ["steps", "walk", "walking", "pasos", "caminar"],
  bike: ["bike", "cycle", "ride", "bici", "ciclismo"],
  target: ["target", "goal", "aim", "objetivo"],
  mountain: ["mountain", "hike", "climb", "monte", "escalar"],
  waves: ["swim", "surf", "ocean", "natacion", "mar"],
  medal: ["medal", "award", "medalla", "premio"],
  volleyball: ["volleyball", "voley", "ball", "deporte"],
  activity: ["activity", "fitness", "pulse", "actividad", "cardio"],
  tent: ["tent", "camp", "camping", "outdoors", "carpa"],
  snowflake: ["snow", "winter", "ski", "esquiar", "nieve", "frio"],
  // food
  coffee: ["coffee", "cafe", "tea", "drink"],
  droplet: ["water", "agua", "hydrate", "tomar"],
  apple: ["apple", "manzana", "fruit", "fruta"],
  pizza: ["pizza", "comida"],
  cake: ["cake", "torta", "dulce", "postre"],
  salad: ["salad", "ensalada", "veg", "verdura", "healthy"],
  cookie: ["cookie", "galleta", "snack"],
  beer: ["beer", "cerveza", "bar", "alcohol"],
  "ice-cream": ["icecream", "ice cream", "helado", "dessert", "postre"],
  wine: ["wine", "vino", "alcohol", "cellar"],
  sandwich: ["sandwich", "lunch", "almuerzo"],
  soup: ["soup", "sopa", "warm", "caldo"],
  // life
  heart: ["health", "love", "salud", "corazon"],
  book: ["book", "read", "leer", "lectura", "libro", "study", "estudiar"],
  library: ["library", "books", "biblioteca", "reading"],
  "file-text": ["write", "note", "doc", "pages", "paginas", "escribir"],
  clock: ["time", "tiempo", "hours", "horas", "minutos"],
  flame: ["streak", "racha", "fire", "calorias", "burn"],
  leaf: ["nature", "eco", "green", "plant", "meditate", "mindful"],
  plane: ["travel", "viaje", "trip", "flight", "japan", "japon", "vacation", "vacaciones"],
  home: ["home", "casa", "house"],
  car: ["car", "auto", "drive", "manejar"],
  music: ["music", "song", "musica", "cancion"],
  camera: ["photo", "camera", "picture", "foto"],
  // others
  flag: ["goal", "objetivo", "meta"],
  wallet: ["wallet", "budget", "spend", "gasto", "money"],
  "dollar-sign": ["save", "ahorro", "ahorrar", "money", "plata", "cash", "japan", "trip", "fund"],
  gem: ["gem", "diamond", "joya", "luxury"],
  "credit-card": ["card", "credit", "tarjeta", "pay"],
  sparkles: ["sparkle", "magic", "shine", "brillo"],
  briefcase: ["work", "office", "trabajo", "job"],
  gift: ["gift", "regalo", "present"],
  "piggy-bank": ["save", "savings", "ahorro", "ahorrar", "pig", "piggy"],
  star: ["star", "favorite", "estrella", "favorito"],
  sun: ["sun", "sol", "day", "shine", "summer", "verano"],
  bell: ["bell", "notification", "campana", "alerta", "alarm"],
};

export function suggestIcon(name: string): string | null {
  const q = name.toLowerCase();
  if (!q.trim()) return null;
  for (const [id, tags] of Object.entries(ICON_TAGS)) {
    if (tags.some((t) => q.includes(t))) return id;
  }
  return null;
}

export function GoalIcon({
  name,
  size = 20,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const Component = ICONS[name] ?? Flag;
  return <Component size={size} color={color} />;
}

type Props = {
  value: string;
  onChange: (icon: string) => void;
};

export function IconPicker({ value, onChange }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <View className="flex-row flex-wrap gap-2">
      {ICON_OPTIONS.map((icon) => {
        const active = value === icon;
        return (
          <Pressable
            key={icon}
            onPress={() => onChange(icon)}
            className={`w-12 h-12 rounded-token-lg items-center justify-center border active:scale-95 ${
              active
                ? "bg-brand-green border-brand-green"
                : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
            }`}
          >
            <GoalIcon
              name={icon}
              size={20}
              color={active ? "#163300" : isDark ? "#ffffff" : "#0e0f0c"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
