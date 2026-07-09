export const fioriColors = {
  background: "#07111F",
  sidebar: "#081421",
  cards: "#0E1A2B",
  hover: "#162842",
  primary: "#00B8FF",
  success: "#00E676",
  warning: "#FFC107",
  danger: "#EF4444",
  border: "#233550",
  text: "#F8FAFC",
} as const;

export type FioriColorKey = keyof typeof fioriColors;

export const fioriRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
} as const;

export const fioriShadows = {
  soft: "0 18px 70px rgba(0, 0, 0, 0.25)",
  card: "0 10px 40px rgba(0, 0, 0, 0.22)",
  glowPrimary: "0 0 0 1px rgba(0, 184, 255, 0.25), 0 0 32px rgba(0, 184, 255, 0.12)",
} as const;

