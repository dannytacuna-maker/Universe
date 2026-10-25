export const dashboardSectionIds = [
  "home",
  "university",
  "french",
  "jiu-jitsu",
  "strength-physique",
  "reading",
  "observatory",
] as const;

export type DashboardSectionId = (typeof dashboardSectionIds)[number];

export type JiuJitsuSubview = "log" | "review";
export type StrengthSubview = "training" | "archive" | "playlist";

export type DashboardNavigation = Readonly<{
  section: DashboardSectionId;
  jiuJitsuSubview: JiuJitsuSubview;
  strengthSubview: StrengthSubview;
}>;

export const defaultDashboardNavigation: DashboardNavigation = {
  section: "home",
  jiuJitsuSubview: "log",
  strengthSubview: "training",
};

export type DashboardNavItem = Readonly<{
  id: DashboardSectionId;
  label: string;
}>;

export type DashboardNavGroup = Readonly<{
  id: string;
  label: string;
  items: readonly DashboardNavItem[];
}>;

export const dashboardNavGroups = [
  {
    id: "academic",
    label: "University",
    items: [{ id: "university", label: "Operations" }],
  },
  {
    id: "personal-growth",
    label: "Personal Growth",
    items: [
      { id: "french", label: "French" },
      { id: "jiu-jitsu", label: "Jiu-Jitsu" },
      { id: "strength-physique", label: "Strength" },
      { id: "reading", label: "Reading" },
    ],
  },
] as const satisfies readonly DashboardNavGroup[];

export const dashboardTopLevelItems = [
  { id: "home", label: "Home" },
  { id: "observatory", label: "Observatory" },
] as const satisfies readonly DashboardNavItem[];

const sectionParameter = "section";
const destinationParameter = "destination";

function isDashboardSectionId(value: string): value is DashboardSectionId {
  return (dashboardSectionIds as readonly string[]).includes(value);
}

function parseSectionPath(path: string): DashboardNavigation | null {
  const [sectionId, subview, ...rest] = path.split("/").filter(Boolean);
  if (sectionId === undefined || rest.length > 0) return null;
  if (!isDashboardSectionId(sectionId)) return null;

  if (sectionId === "jiu-jitsu") {
    if (subview === undefined || subview === "log") {
      return { ...defaultDashboardNavigation, section: "jiu-jitsu" };
    }
    if (subview === "review") {
      return {
        ...defaultDashboardNavigation,
        section: "jiu-jitsu",
        jiuJitsuSubview: "review",
      };
    }
    return null;
  }

  if (sectionId === "strength-physique") {
    if (subview === undefined || subview === "training") {
      return { ...defaultDashboardNavigation, section: "strength-physique" };
    }
    if (subview === "archive" || subview === "playlist") {
      return {
        ...defaultDashboardNavigation,
        section: "strength-physique",
        strengthSubview: subview,
      };
    }
    return null;
  }

  if (subview !== undefined) return null;
  return { ...defaultDashboardNavigation, section: sectionId };
}

function migrateLegacyDestination(destination: string): DashboardNavigation {
  if (destination === "observatory") {
    return { ...defaultDashboardNavigation, section: "observatory" };
  }

  if (destination === "university" || destination.startsWith("university/")) {
    return { ...defaultDashboardNavigation, section: "university" };
  }

  if (destination === "forge/websites" || destination.startsWith("forge/")) {
    return defaultDashboardNavigation;
  }

  if (
    destination.includes("celestial-library") ||
    destination === "personal-growth/reading" ||
    destination.startsWith("personal-growth/reading/")
  ) {
    return { ...defaultDashboardNavigation, section: "reading" };
  }

  if (
    destination.includes("hyperbolic-time-chamber") ||
    destination.endsWith("/review")
  ) {
    return {
      ...defaultDashboardNavigation,
      section: "jiu-jitsu",
      jiuJitsuSubview: "review",
    };
  }

  if (
    destination.includes("jiu-jitsu") ||
    destination === "personal-growth/jiu-jitsu"
  ) {
    return { ...defaultDashboardNavigation, section: "jiu-jitsu" };
  }

  if (
    destination.includes("training-archive") ||
    destination.endsWith("/archive")
  ) {
    return {
      ...defaultDashboardNavigation,
      section: "strength-physique",
      strengthSubview: "archive",
    };
  }

  if (
    destination.includes("gym-playlist") ||
    destination.endsWith("/playlist")
  ) {
    return {
      ...defaultDashboardNavigation,
      section: "strength-physique",
      strengthSubview: "playlist",
    };
  }

  if (
    destination.includes("beerus") ||
    destination.includes("strength-physique")
  ) {
    return { ...defaultDashboardNavigation, section: "strength-physique" };
  }

  if (destination.includes("french") || destination.includes("lumiere")) {
    return { ...defaultDashboardNavigation, section: "french" };
  }

  if (destination === "personal-growth") {
    return defaultDashboardNavigation;
  }

  return defaultDashboardNavigation;
}

export function readDashboardNavigation(search: string): DashboardNavigation {
  const parameters = new URLSearchParams(search);
  const section = parameters.get(sectionParameter);
  if (section !== null) {
    return parseSectionPath(section) ?? defaultDashboardNavigation;
  }

  const destination = parameters.get(destinationParameter);
  if (destination !== null) {
    return migrateLegacyDestination(destination);
  }

  return defaultDashboardNavigation;
}

export function createDashboardNavigationPath(
  navigation: DashboardNavigation,
): string {
  if (navigation.section === "jiu-jitsu") {
    return navigation.jiuJitsuSubview === "review"
      ? "jiu-jitsu/review"
      : "jiu-jitsu";
  }

  if (navigation.section === "strength-physique") {
    if (navigation.strengthSubview === "archive") {
      return "strength-physique/archive";
    }
    if (navigation.strengthSubview === "playlist") {
      return "strength-physique/playlist";
    }
    return "strength-physique";
  }

  return navigation.section;
}

export function createDashboardNavigationUrl(
  currentHref: string,
  navigation: DashboardNavigation,
) {
  const url = new URL(currentHref);
  url.searchParams.delete(destinationParameter);

  if (navigation.section === "home") {
    url.searchParams.delete(sectionParameter);
  } else {
    url.searchParams.set(
      sectionParameter,
      createDashboardNavigationPath(navigation),
    );
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function sectionTitle(section: DashboardSectionId): string {
  switch (section) {
    case "home":
      return "Home";
    case "university":
      return "University";
    case "french":
      return "French";
    case "jiu-jitsu":
      return "Jiu-Jitsu";
    case "strength-physique":
      return "Strength";
    case "reading":
      return "Reading";
    case "observatory":
      return "Observatory";
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}
