import { useEffect, useState, type ChangeEvent } from "react";
import { Field } from "@bmad/ui";
import { RangeSlider } from "./RangeSlider";

export interface RangeControlProps {
  /** Stable key used to derive each Field's id — e.g. "iso", "date". */
  id: string;
  dataLabel: string;
  /** Defaults to "number"; "date" compares min/max lexicographically instead
   * of numerically (works directly on `YYYY-MM-DD` strings). */
  type?: "number" | "date";
  minLabel?: string;
  maxLabel?: string;
  /** Raw input strings, not `RangeFilter`'s parsed numbers — "" means
   * unbounded on that side. The caller (FacetPanel) converts to/from the
   * store's `RangeFilter` shape. */
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  /** Domain bounds for the optional dual-thumb slider (user request,
   * 2026-07-08) — `type="date"` or an omitted prop skips the slider,
   * falling back to the two Fields alone. */
  sliderBounds?: [number, number];
  sliderStep?: number;
}

/** Pure so the min>max rule (AC #3) is unit-testable without rendering.
 * Blank sides are never invalid — either side blank means unbounded. */
export function isRangeInvalid(type: "number" | "date", minStr: string, maxStr: string): boolean {
  if (minStr === "" || maxStr === "") {
    return false;
  }
  if (type === "number") {
    return Number(minStr) > Number(maxStr);
  }
  return minStr > maxStr;
}

/**
 * Two underline Fields (Story 1.4) sharing one data-label row (Task 1).
 * Holds its own draft state so an in-progress invalid range doesn't clobber
 * the last committed valid filter — AC #3 requires the previous value (or
 * unbounded) to stay active until the range is corrected. The draft
 * re-syncs from `min`/`max` only when they change from *outside* this
 * component (e.g. Clear-all), since a valid local edit already matches the
 * committed value it just produced.
 */
export function RangeControl({
  id,
  dataLabel,
  type = "number",
  minLabel = type === "date" ? "FROM" : "MIN",
  maxLabel = type === "date" ? "TO" : "MAX",
  min,
  max,
  onChange,
  sliderBounds,
  sliderStep,
}: RangeControlProps) {
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);

  useEffect(() => {
    setDraftMin(min);
    setDraftMax(max);
  }, [min, max]);

  const invalid = isRangeInvalid(type, draftMin, draftMax);

  function commit(nextMin: string, nextMax: string) {
    setDraftMin(nextMin);
    setDraftMax(nextMax);
    if (!isRangeInvalid(type, nextMin, nextMax)) {
      onChange(nextMin, nextMax);
    }
  }

  function handleMinChange(event: ChangeEvent<HTMLInputElement>) {
    commit(event.target.value, draftMax);
  }

  function handleMaxChange(event: ChangeEvent<HTMLInputElement>) {
    commit(draftMin, event.target.value);
  }

  // The slider always produces an in-range (valid) pair by construction —
  // hidden while the Fields are mid-edit and invalid so it never shows a
  // stale position fighting with the error text below.
  const showSlider = type === "number" && sliderBounds !== undefined && !invalid;

  function handleSliderChange(nextMin: number, nextMax: number) {
    commit(String(nextMin), String(nextMax));
  }

  return (
    <div>
      <div className="mb-2 text-data-label text-muted2 uppercase">{dataLabel}</div>
      {showSlider && (
        <RangeSlider
          min={sliderBounds[0]}
          max={sliderBounds[1]}
          step={sliderStep}
          valueMin={draftMin === "" ? sliderBounds[0] : Number(draftMin)}
          valueMax={draftMax === "" ? sliderBounds[1] : Number(draftMax)}
          onChange={handleSliderChange}
        />
      )}
      <div className={`flex gap-3 ${type === "date" ? "flex-col" : ""} ${showSlider ? "mt-4" : ""}`}>
        <Field id={`${id}-min`} label={minLabel} type={type} value={draftMin} onChange={handleMinChange} />
        <Field
          id={`${id}-max`}
          label={maxLabel}
          type={type}
          value={draftMax}
          onChange={handleMaxChange}
          error={invalid ? "Must be ≥ min" : undefined}
        />
      </div>
    </div>
  );
}
