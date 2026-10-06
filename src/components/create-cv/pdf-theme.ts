import type { Styles } from "@react-pdf/renderer";
import type { CVTemplateTheme } from "@/types";

export function applyPDFTheme<T extends Styles>(base: T, colors: Record<string, string>, theme?: CVTemplateTheme): T {
  if (!theme) return base;
  const primary = ["primary", "entryTitle", "navy", "sidebar", "sidebarBg"].map((key) => colors[key]).filter(Boolean);
  const accent = ["accent", "gold", "black", "mainTitle", "mainBorder", "entrySubtitle", "bulletAccent"].map((key) => colors[key]).filter(Boolean);
  const ratio = theme.fontSize / (typeof base.page?.fontSize === "number" ? base.page.fontSize : 10);
  return Object.fromEntries(Object.entries(base).map(([name, style]) => {
    const result = { ...style };
    if (typeof result.fontSize === "number") result.fontSize *= ratio;
    if (name === "page") result.fontFamily = theme.fontFamily;
    for (const property of ["color", "backgroundColor", "borderColor", "borderTopColor", "borderBottomColor", "borderLeftColor", "borderRightColor"] as const) {
      const value = result[property];
      if (typeof value !== "string") continue;
      if (accent.includes(value)) result[property] = theme.accentColor;
      else if (primary.includes(value)) result[property] = theme.primaryColor;
    }
    return [name, result];
  })) as T;
}
