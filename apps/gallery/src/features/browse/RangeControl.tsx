import { useEffect, useState, type ChangeEvent } from "react";
import { Field } from "@bmad/ui";

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
}: RangeControlProps) {
  const [draftMin, setDraftMin] = useState(min);
  const [draftMax, setDraftMax] = useState(max);

  useEffect(() => {
    setDraftMin(min);
    setDraftMax(max);
  }, [min, max]);

  const invalid = isRangeInvalid(type, draftMin, draftMax);

  function handleMinChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setDraftMin(value);
    if (!isRangeInvalid(type, value, draftMax)) {
      onChange(value, draftMax);
    }
  }

  function handleMaxChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setDraftMax(value);
    if (!isRangeInvalid(type, draftMin, value)) {
      onChange(draftMin, value);
    }
  }

  return (
    <div>
      <div className="mb-2 text-data-label text-muted2 uppercase">{dataLabel}</div>
      <div className="flex gap-3">
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
