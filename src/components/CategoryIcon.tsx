import {
  ToyBrick,
  Car,
  Flame,
  Hammer,
  Monitor,
  PaintRoller,
  Refrigerator,
  Sparkles,
  Trees,
  Truck,
  Wrench,
  Zap,
  Briefcase,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Wrench,
  Zap,
  Hammer,
  Car,
  ToyBrick,
  PaintRoller,
  Sparkles,
  Trees,
  Flame,
  Refrigerator,
  Truck,
  Monitor,
};

export function CategoryIcon({
  iconName,
  ...props
}: { iconName?: string | null } & LucideProps) {
  const Icon = (iconName && ICONS[iconName]) || Briefcase;
  return <Icon {...props} />;
}
