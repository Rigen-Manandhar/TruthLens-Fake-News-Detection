export type NavKey = "news" | "fake" | "deepfake" | "admin";

export type NavIndicator = {
  left: number;
  top: number;
  width: number;
  height: number;
  visible: boolean;
  animated: boolean;
};

export const INITIAL_INDICATOR: NavIndicator = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  visible: false,
  animated: false,
};

export const MAIN_NAV_ITEMS: Array<{
  key: NavKey;
  href: string;
  label: string;
  adminOnly?: boolean;
}> = [
  { key: "news", href: "/", label: "News" },
  { key: "fake", href: "/fake-detection", label: "Risk Assessment" },
  { key: "deepfake", href: "/deepfake-detection", label: "Deepfake" },
  { key: "admin", href: "/admin", label: "Admin", adminOnly: true },
];
