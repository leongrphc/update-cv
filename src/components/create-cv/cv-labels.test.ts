import { expect, it } from "vitest";
import { formatDateRange } from "./cv-labels";

it.each([
  ["2020", "", false, "tr", "2020"],
  ["", "2024-05", false, "en", "May 2024"],
  ["2020", "", true, "en", "2020 - Present"],
  ["2020", "2024", false, "tr", "2020 - 2024"],
  ["", "", false, "tr", ""],
  ["2020-13", "", false, "tr", "2020-13"],
  ["2020", "Mart 2024", false, "tr", "2020 - Mart 2024"],
  ["2020-01", "2024-02", false, "tr", "Oca 2020 - Şub 2024"],
] as const)("preserves date precision and missing values: %s / %s", (start, end, current, lang, expected) => {
  expect(formatDateRange(start, end, current, lang)).toBe(expected);
});
