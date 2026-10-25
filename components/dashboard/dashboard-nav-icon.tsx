import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Dumbbell,
  GraduationCap,
  Home,
  Languages,
  Swords,
  Telescope,
} from "lucide-react";

import type { DashboardSectionId } from "@/lib/dashboard-sections";

const sectionIcons = {
  french: Languages,
  home: Home,
  "jiu-jitsu": Swords,
  observatory: Telescope,
  reading: BookOpen,
  "strength-physique": Dumbbell,
  university: GraduationCap,
} as const satisfies Record<DashboardSectionId, LucideIcon>;

type DashboardNavIconProps = Readonly<{
  active?: boolean;
  section: DashboardSectionId;
  size?: number;
}>;

export function DashboardNavIcon({
  section,
  size = 16,
}: DashboardNavIconProps) {
  const Icon = sectionIcons[section];

  return (
    <Icon aria-hidden="true" absoluteStrokeWidth size={size} strokeWidth={2} />
  );
}
