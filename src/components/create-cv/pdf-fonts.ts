import { Font } from "@react-pdf/renderer";

// Bundle the existing fonts so PDF generation does not depend on a third-party CDN.
const base = typeof window === "undefined"
  ? `${process.cwd()}/public/fonts/open-sans`
  : "/fonts/open-sans";

Font.register({ family: "Open Sans", fonts: [
  { src: `${base}/open-sans-regular.ttf`, fontWeight: 400 },
  { src: `${base}/open-sans-600.ttf`, fontWeight: 600 },
  { src: `${base}/open-sans-700.ttf`, fontWeight: 700 },
] });
Font.registerHyphenationCallback((word) => [word]);
const fontRoot = typeof window === "undefined" ? `${process.cwd()}/public/fonts` : "/fonts";
Font.register({ family: "Lato", fonts: [
  { src: `${fontRoot}/lato/Lato-Regular.ttf`, fontWeight: 400 },
  { src: `${fontRoot}/lato/Lato-SemiBold.ttf`, fontWeight: 600 },
  { src: `${fontRoot}/lato/Lato-Bold.ttf`, fontWeight: 700 },
] });
Font.register({ family: "PT Serif", fonts: [
  { src: `${fontRoot}/ptserif/PT_Serif-Web-Regular.ttf`, fontWeight: 400 },
  { src: `${fontRoot}/ptserif/PT_Serif-Web-Bold.ttf`, fontWeight: 700 },
] });

export function reloadPDFFonts() {
  // A failed font request is cached by React PDF. Re-register definitions for a real retry.
  const definitions = Object.entries(Font.getRegisteredFonts()).map(([family, entry]) => ({
    family, fonts: entry.sources.map((source) => ({ ...source.options,
      src: source.src, fontStyle: source.fontStyle, fontWeight: source.fontWeight })),
  }));
  Font.clear();
  definitions.forEach((definition) => Font.register(definition));
  Font.registerHyphenationCallback((word) => [word]);
}
