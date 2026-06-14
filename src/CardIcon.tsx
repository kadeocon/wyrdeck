/**
 * Resolves a lucide icon name string (as stored in Card.art) to the
 * lucide-react-native component and renders it. Only the icon names
 * actually present in src/data/tarot.ts are included.
 */
import type { LucideProps } from "lucide-react-native";
import {
  Anchor, Castle, Circle, Coins, Crown, Droplets, Dumbbell,
  Feather, Flame, FlaskConical, Flower, Globe, Heart, Key,
  Lamp, Link, Megaphone, Moon, MoonStar, Mountain, RefreshCw,
  Rocket, Scale, Scroll, Shield, Skull, Sparkles, Star, Sun,
  Sword, Swords, Wand2, Wind, Wine,
} from "lucide-react-native";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  anchor: Anchor,
  castle: Castle,
  coins: Coins,
  crown: Crown,
  droplets: Droplets,
  dumbbell: Dumbbell,
  feather: Feather,
  flame: Flame,
  "flask-conical": FlaskConical,
  flower: Flower,
  globe: Globe,
  heart: Heart,
  key: Key,
  lamp: Lamp,
  link: Link,
  megaphone: Megaphone,
  moon: Moon,
  "moon-star": MoonStar,
  mountain: Mountain,
  "refresh-cw": RefreshCw,
  rocket: Rocket,
  scale: Scale,
  scroll: Scroll,
  shield: Shield,
  skull: Skull,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  sword: Sword,
  swords: Swords,
  "wand-2": Wand2,
  wind: Wind,
  wine: Wine,
};

interface CardIconProps extends Omit<LucideProps, "ref"> {
  name: string;
}

export function CardIcon({ name, ...props }: CardIconProps) {
  const Icon = ICON_MAP[name] ?? Circle;
  return <Icon {...props} />;
}
