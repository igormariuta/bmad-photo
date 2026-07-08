import { Button, Checkbox } from "@bmad/ui";
import {
  clearAllFacetFilters,
  setFacetFilter,
  toggleInArray,
  useFacetFilters,
  useFacetValueOptions,
  type RangeFilter,
} from "../../store/ingestStore";
import { RangeSlider, SingleSlider } from "./RangeSlider";

/** Exported for unit testing — shutter speeds read as fractions below 1s
 * (matching photographic convention, e.g. "1/500s"), plain seconds above. */
export function formatShutterSpeed(value: number): string {
  return value >= 1 ? `${value}s` : `1/${Math.round(1 / value)}s`;
}

/** Exported for unit testing — a leading "+" for positive EV, per
 * photographic convention (e.g. "+0.3", "-0.3", "0"). */
export function formatExposureComp(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatMegapixelMode(value: 12 | 48): string {
  return value === 12 ? "12 MP (standard)" : "48 MP (ProRAW)";
}

function formatLens(value: number): string {
  return `${value}mm`;
}

function formatAperture(value: number): string {
  return `f/${value}`;
}

interface CheckboxFacetGroupProps<T extends number> {
  facetKey: string;
  label: string;
  options: readonly T[];
  selected: readonly T[];
  formatLabel: (value: T) => string;
  onToggle: (value: T) => void;
}

/**
 * Checkbox-style multi-select Facet (UX redesign, 2026-07-08 — user
 * request: exact values that actually occur in the ingested photos, no
 * slider values that don't exist in the data). Renders nothing selectable
 * when the batch has no data for this dimension, matching Insights'
 * existing "No data for this batch." convention. Generic over `T extends
 * number` (not just `number`) so `megapixelMode: (12 | 48)[]` infers
 * without widening `formatMegapixelMode`'s parameter type.
 */
function CheckboxFacetGroup<T extends number>({
  facetKey,
  label,
  options,
  selected,
  formatLabel,
  onToggle,
}: CheckboxFacetGroupProps<T>) {
  return (
    <div>
      <div className="mb-2 text-data-label text-muted2 uppercase">{label}</div>
      {options.length === 0 ? (
        <p className="text-caption text-muted">No data for this batch.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {options.map((value) => (
            <Checkbox
              key={value}
              id={`facet-${facetKey}-${value}`}
              label={formatLabel(value)}
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SliderFacetProps {
  label: string;
  values: readonly number[];
  filter: RangeFilter;
  formatValue: (value: number) => string;
  onChange: (min: number, max: number) => void;
}

type SliderMode = "single" | "range";

/**
 * A single icon button, not two (round-6 UX request, reversing round 5's
 * segmented control) — muted-background fill instead of a bordered box,
 * showing the *current* mode's glyph ("•" one value, "↔" a range); clicking
 * flips to the other mode. Disabled when the Facet has ≤1 distinct value —
 * a "range" of one value is meaningless, so there's nothing to toggle to.
 */
function SliderModeToggle({
  mode,
  disabled,
  onToggle,
}: {
  mode: SliderMode;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={mode === "single" ? "Picking one value — switch to a range" : "Picking a range — switch to one value"}
      aria-pressed={mode === "range"}
      disabled={disabled}
      onClick={onToggle}
      className={`flex size-5 flex-none items-center justify-center bg-dim text-caption leading-none text-muted2 disabled:cursor-not-allowed disabled:opacity-50 ${
        disabled ? "" : "hover:bg-accent hover:text-bg"
      }`}
    >
      {mode === "single" ? "•" : "↔"}
    </button>
  );
}

/**
 * Slider-driven Facet (lens/aperture/shutter/ISO/year) — the slider always
 * operates on *indices* into the batch's sorted distinct values, never a
 * continuous numeric domain, so it can only land on a value that actually
 * occurs. A toggle switches between "pick one exact value" (single thumb,
 * `min === max`) and "pick a range" (two thumbs) — both read/write the
 * same `RangeFilter` shape, `matchesRange` already treats `min === max` as
 * an exact match with no store-level change needed.
 *
 * `isSingle` is *derived directly from `filter`* every render — not tracked
 * as separate React state. An earlier version kept its own `mode` state,
 * which could drift out of sync with the actual filter (e.g. dragging both
 * range thumbs to the same value left the UI showing the range icon/two
 * overlapping thumbs while the filter was already a collapsed single
 * value) — a real bug caught by the user. Deriving from `filter` means the
 * display can never disagree with what's actually being matched. With only
 * one distinct value, range mode is locked out entirely — always
 * `"single"`, toggle disabled.
 */
function SliderFacet({ label, values, filter, formatValue, onChange }: SliderFacetProps) {
  const canRange = values.length > 1;

  if (values.length === 0) {
    return (
      <div>
        <div className="mb-2 text-data-label text-muted2 uppercase">{label}</div>
        <p className="text-caption text-muted">No data for this batch.</p>
      </div>
    );
  }

  const lastIndex = values.length - 1;
  const firstValue = values[0] ?? 0;
  const lastValue = values[lastIndex] ?? firstValue;
  const minIndex = filter.min === undefined ? 0 : Math.max(0, values.indexOf(filter.min));
  const maxIndex = filter.max === undefined ? lastIndex : Math.max(0, values.indexOf(filter.max));
  const minValue = values[minIndex] ?? firstValue;
  const maxValue = values[maxIndex] ?? lastValue;
  const isSingle = !canRange || minValue === maxValue;

  function handleToggle() {
    if (!canRange) {
      return;
    }
    if (isSingle) {
      onChange(firstValue, lastValue); // expand to the full available range
    } else {
      onChange(minValue, minValue); // collapse to the current lower value
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-data-label text-muted2 uppercase">{label}</span>
        <SliderModeToggle
          mode={isSingle ? "single" : "range"}
          disabled={!canRange}
          onToggle={handleToggle}
        />
      </div>
      {isSingle ? (
        <SingleSlider
          min={0}
          max={lastIndex}
          step={1}
          value={minIndex}
          onChange={(i) => {
            const v = values[i] ?? firstValue;
            onChange(v, v);
          }}
        />
      ) : (
        <RangeSlider
          min={0}
          max={lastIndex}
          step={1}
          valueMin={minIndex}
          valueMax={maxIndex}
          onChange={(i, j) => onChange(values[i] ?? firstValue, values[j] ?? lastValue)}
        />
      )}
      <p className="mt-3 text-body text-fg">
        {isSingle ? formatValue(minValue) : `${formatValue(minValue)} – ${formatValue(maxValue)}`}
      </p>
    </div>
  );
}

interface CameraFacetProps {
  value: "front" | "rear" | undefined;
  onChange: (value: "front" | "rear" | undefined) => void;
}

const CAMERA_OPTIONS = [
  { value: "all", label: "All" },
  { value: "front", label: "Front" },
  { value: "rear", label: "Rear" },
] as const;

/**
 * Compact horizontal Camera selector (round-6/7/8 UX requests) — one row, a
 * small label below each option, spread with `justify-between` across the
 * sidebar's full width (round 7) rather than clustered with a fixed gap —
 * takes minimal *vertical* space even when shown. Gallery-local rather than
 * a `packages/ui` `RadioGroup` variant, since this row-with-label-below
 * layout is specific to this one Facet.
 *
 * The caller (`FacetPanel`) only renders this component at all when the
 * batch has *both* front and rear camera photos (round 8) — with only one
 * of the two present, "All" and that one value would filter to the exact
 * same set, so Front/Rear would never be a real choice; no per-option
 * `disabled` state is needed here since that case never reaches this
 * component.
 */
function CameraFacet({ value, onChange }: CameraFacetProps) {
  const current = value ?? "all";

  return (
    <fieldset>
      <legend className="mb-2 text-data-label text-muted2 uppercase">Camera</legend>
      <div className="flex justify-between">
        {CAMERA_OPTIONS.map((option) => {
          const isChecked = option.value === current;
          const optionId = `facet-camera-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className="flex cursor-pointer flex-col items-center gap-1.5"
            >
              <input
                id={optionId}
                type="radio"
                name="facet-camera"
                value={option.value}
                checked={isChecked}
                onChange={() => onChange(option.value === "all" ? undefined : option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-4.5 items-center justify-center border-2 ${
                  isChecked ? "border-accent" : "border-dim"
                }`}
              >
                {isChecked && <span className="size-2 bg-accent" />}
              </span>
              <span className="text-caption text-muted2 uppercase">{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Fills the persistent global sidebar (App.tsx) — desktop only, the mobile
 * slide-up-sheet requirement from AC #1/#4 is deferred (see
 * deferred-work.md). The 8 Facets (Dev Notes' field mapping), each always
 * showing its real control; every control commits directly to the store on
 * change (AC #4, no Apply step). No divider lines between Facets (round 7 —
 * "an extra thing that adds extra spacing") — the parent's `gap-6` alone
 * separates them. Order (round-5 user request): Camera, Year, Lens,
 * Aperture, Shutter, ISO, Exposure comp, Megapixel mode. Camera itself is
 * hidden entirely unless the batch has *both* front and rear camera photos
 * (round 8, tightened from round 6's "neither" check) — with only one of
 * the two present, "All" and that value already filter to the same set,
 * so there's no real choice to offer.
 */
export function FacetPanel() {
  const filters = useFacetFilters();
  const options = useFacetValueOptions();
  const hasCameraChoice = options.hasCameraFront && options.hasCameraRear;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-eyebrow text-accent uppercase">// FILTERS</p>

      {hasCameraChoice && (
        <CameraFacet value={filters.camera} onChange={(value) => setFacetFilter("camera", value)} />
      )}

      <SliderFacet
        label="Year"
        values={options.years}
        filter={filters.years}
        formatValue={(value) => String(value)}
        onChange={(min, max) => setFacetFilter("years", { min, max })}
      />

      <SliderFacet
        label="Lens / focal length"
        values={options.lens}
        filter={filters.lens}
        formatValue={formatLens}
        onChange={(min, max) => setFacetFilter("lens", { min, max })}
      />

      <SliderFacet
        label="Aperture"
        values={options.aperture}
        filter={filters.aperture}
        formatValue={formatAperture}
        onChange={(min, max) => setFacetFilter("aperture", { min, max })}
      />

      <SliderFacet
        label="Shutter speed"
        values={options.shutter}
        filter={filters.shutter}
        formatValue={formatShutterSpeed}
        onChange={(min, max) => setFacetFilter("shutter", { min, max })}
      />

      <SliderFacet
        label="ISO"
        values={options.iso}
        filter={filters.iso}
        formatValue={(value) => String(value)}
        onChange={(min, max) => setFacetFilter("iso", { min, max })}
      />

      <SliderFacet
        label="Exposure comp (EV)"
        values={options.exposureComp}
        filter={filters.exposureComp}
        formatValue={formatExposureComp}
        onChange={(min, max) => setFacetFilter("exposureComp", { min, max })}
      />

      <CheckboxFacetGroup
        facetKey="megapixel"
        label="Megapixel mode"
        options={options.megapixelMode}
        selected={filters.megapixelMode}
        formatLabel={formatMegapixelMode}
        onToggle={(value) => setFacetFilter("megapixelMode", toggleInArray(filters.megapixelMode, value))}
      />

      <Button type="button" variant="outline" onClick={clearAllFacetFilters}>
        Clear filters
      </Button>
    </div>
  );
}
