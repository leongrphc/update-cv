"use client";

interface CVDiffProps {
  oldText: string;
  newText: string;
  oldLabel: string;
  newLabel: string;
}

function computeDiff(oldLines: string[], newLines: string[]) {
  const result: { type: "same" | "add" | "remove"; text: string }[] = [];
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      result.push({ type: "same", text: oldLines[oi] });
      oi++;
      ni++;
    } else if (oi < oldLines.length && !newSet.has(oldLines[oi])) {
      result.push({ type: "remove", text: oldLines[oi] });
      oi++;
    } else if (ni < newLines.length && !oldSet.has(newLines[ni])) {
      result.push({ type: "add", text: newLines[ni] });
      ni++;
    } else if (oi < oldLines.length) {
      result.push({ type: "remove", text: oldLines[oi] });
      oi++;
    } else {
      result.push({ type: "add", text: newLines[ni] });
      ni++;
    }
  }

  return result;
}

export default function CVDiff({ oldText, newText, oldLabel, newLabel }: CVDiffProps) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const diff = computeDiff(oldLines, newLines);

  const addCount = diff.filter((d) => d.type === "add").length;
  const removeCount = diff.filter((d) => d.type === "remove").length;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{oldLabel}</span>
            {" → "}
            <span className="font-medium text-slate-700 dark:text-slate-300">{newLabel}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">+{addCount}</span>
          <span className="text-red-500 dark:text-red-400">-{removeCount}</span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed">
        {diff.map((line, i) => (
          <div
            key={i}
            className={`px-4 py-0.5 border-l-2 ${
              line.type === "add"
                ? "bg-emerald-50 dark:bg-emerald-900/10 border-l-emerald-500 text-emerald-800 dark:text-emerald-300"
                : line.type === "remove"
                ? "bg-red-50 dark:bg-red-900/10 border-l-red-500 text-red-800 dark:text-red-300 line-through opacity-70"
                : "border-l-transparent text-slate-600 dark:text-slate-400"
            }`}
          >
            <span className="select-none mr-2 text-slate-400 dark:text-slate-600 w-4 inline-block text-right">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
