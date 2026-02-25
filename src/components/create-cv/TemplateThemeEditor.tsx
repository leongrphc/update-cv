"use client";

import { type CVTemplateTheme, DEFAULT_THEME } from "@/types";

const PRESET_COLORS = [
  { name: "Mavi", primary: "#1a1a1a", accent: "#2563eb" },
  { name: "Yeşil", primary: "#1a1a1a", accent: "#059669" },
  { name: "Mor", primary: "#1a1a1a", accent: "#7c3aed" },
  { name: "Kırmızı", primary: "#1a1a1a", accent: "#dc2626" },
  { name: "Turuncu", primary: "#1a1a1a", accent: "#ea580c" },
  { name: "Turkuaz", primary: "#1a1a1a", accent: "#0891b2" },
  { name: "Pembe", primary: "#1a1a1a", accent: "#db2777" },
  { name: "Lacivert", primary: "#1e3a5f", accent: "#3b82f6" },
];

const FONT_OPTIONS: { id: CVTemplateTheme["fontFamily"]; label: string }[] = [
  { id: "Open Sans", label: "Open Sans" },
  { id: "Helvetica", label: "Helvetica" },
  { id: "Times-Roman", label: "Times Roman" },
  { id: "Courier", label: "Courier" },
];

interface TemplateThemeEditorProps {
  theme: CVTemplateTheme;
  onChange: (theme: CVTemplateTheme) => void;
}

export default function TemplateThemeEditor({ theme, onChange }: TemplateThemeEditorProps) {
  const isDefault =
    theme.accentColor === DEFAULT_THEME.accentColor &&
    theme.primaryColor === DEFAULT_THEME.primaryColor;

  return (
    <div className="space-y-4">
      {/* Accent Color */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Renk Teması
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange({ ...theme, primaryColor: preset.primary, accentColor: preset.accent })
              }
              className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                theme.accentColor === preset.accent
                  ? "border-slate-900 dark:border-white scale-110 shadow-md"
                  : "border-slate-200 dark:border-slate-700"
              }`}
              style={{ backgroundColor: preset.accent }}
              title={preset.name}
            />
          ))}
          {/* Custom color input */}
          <label
            className={`w-8 h-8 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all hover:scale-110 ${
              PRESET_COLORS.every((p) => p.accent !== theme.accentColor)
                ? "border-slate-900 dark:border-white"
                : "border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-400 via-green-400 to-blue-400"
            }`}
            title="Özel Renk"
          >
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => onChange({ ...theme, accentColor: e.target.value })}
              className="sr-only"
            />
            {PRESET_COLORS.every((p) => p.accent !== theme.accentColor) ? (
              <div className="w-full h-full rounded-md" style={{ backgroundColor: theme.accentColor }} />
            ) : (
              <span className="text-[10px] font-bold text-white">+</span>
            )}
          </label>
        </div>
      </div>

      {/* Font */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Font
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font.id}
              onClick={() => onChange({ ...theme, fontFamily: font.id })}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                theme.fontFamily === font.id
                  ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 font-medium"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Font Boyutu: {theme.fontSize}pt
        </label>
        <input
          type="range"
          min={8}
          max={14}
          step={0.5}
          value={theme.fontSize}
          onChange={(e) => onChange({ ...theme, fontSize: parseFloat(e.target.value) })}
          className="w-full accent-slate-900 dark:accent-white"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>8pt</span>
          <span>14pt</span>
        </div>
      </div>

      {/* Reset */}
      {!isDefault && (
        <button
          onClick={() => onChange(DEFAULT_THEME)}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          ↩ Varsayılana Sıfırla
        </button>
      )}
    </div>
  );
}
