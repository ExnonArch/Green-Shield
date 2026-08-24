import {
  BarChart3,
  BookOpen,
  Home,
  LayoutDashboard,
  ListChecks,
  Map,
  Settings,
  Sparkles,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  short: string;
  blurb: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Home", short: "Home", blurb: "What GreenShield measures and how to read it", icon: Home },
  { to: "/map", label: "Explore Map", short: "Map", blurb: "Pick any point on OpenStreetMap and score it", icon: Map },
  { to: "/dashboard", label: "Dashboard", short: "Dash", blurb: "Every live metric for the active location", icon: LayoutDashboard },
  { to: "/analysis", label: "Location Analysis", short: "Analysis", blurb: "Score breakdown and component maths", icon: BarChart3 },
  { to: "/air-quality", label: "Air Quality", short: "Air", blurb: "PM2.5, PM10, gases and AQI bands", icon: Wind },
  { to: "/trends", label: "Climate Trends", short: "Trends", blurb: "Two decades of reanalysis history", icon: TrendingUp },
  { to: "/actions", label: "Action Center", short: "Actions", blurb: "Prioritised interventions for this place", icon: ListChecks },
  { to: "/methodology", label: "Methodology", short: "Method", blurb: "Formulas, sources and limitations", icon: BookOpen },
  { to: "/settings", label: "Settings", short: "Settings", blurb: "Units, theme and saved locations", icon: Settings },
  { to: "/chat", label: "GreenShield AI", short: "AI", blurb: "Ask about the current readings", icon: Sparkles },
];
