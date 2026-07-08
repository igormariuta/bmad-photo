import { useState, type ReactNode } from "react";
import { Button, Checkbox, RadioGroup } from "@bmad/ui";
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

/**
 * A divider between Facets — no label of its own (UX fix, 2026-07-08:
 * every child control already renders its own label). Always shows the
 * real control, never a collapsed summary.
 */
function FacetField({ children }: { children: ReactNode }) {
  return <div className="border-b-2 border-dim pb-4">{children}</div>;
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

/**
 * Slider-driven Facet (lens/aperture/shutter, round-4 UX request) — the
 * slider always operates on *indices* into the batch's sorted distinct
 * values, never a continuous numeric domain, so it can only land on a
 * value that actually occurs. A toggle switches between "pick one exact
 * value" (single thumb, `min === max`) and "pick a range" (two thumbs) —
 * both read/write the same `RangeFilter` shape, `matchesRange` already
 * treats `min === max` as an exact match with no store-level change needed.
 */
function SliderFacet({ label, values, filter, formatValue, onChange }: SliderFacetProps) {
  const [mode, setMode] = useState<"single" | "range">(
    filter.min !== undefined && filter.min === filter.max ? "single" : "range",
  );

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

  function handleModeToggle() {
    if (mode === "range") {
      setMode("single");
      onChange(minValue, minValue);
    } else {
      setMode("range");
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-data-label text-muted2 uppercase">{label}</span>
        <button
          type="button"
          onClick={handleModeToggle}
          className="text-caption text-muted2 uppercase hover:text-accent"
        >
          {mode === "range" ? "Pick one" : "Pick range"}
        </button>
      </div>
      {mode === "single" ? (
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
        {mode === "single" ? formatValue(minValue) : `${formatValue(minValue)} – ${formatValue(maxValue)}`}
      </p>
    </div>
  );
}

/**
 * Fills the persistent global sidebar (App.tsx) — desktop only, the mobile
 * slide-up-sheet requirement from AC #1/#4 is deferred (see
 * deferred-work.md). The 8 Facets (Dev Notes' field mapping), each always
 * showing its real control; every control commits directly to the store on
 * change (AC #4, no Apply step). Camera listed first (user request,
 * round 4) — the rest keep their existing relative order.
 */
export function FacetPanel() {
  const filters = useFacetFilters();
  const options = useFacetValueOptions();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-eyebrow text-accent uppercase">// FACETS</p>

      <FacetField>
        <RadioGroup
          name="facet-camera"
          label="Camera"
          value={filters.camera ?? "all"}
          onChange={(value) =>
            setFacetFilter("camera", value === "all" ? undefined : (value as "front" | "rear"))
          }
          options={[
            { value: "all", label: "All" },
            { value: "front", label: "Front (selfie)" },
            { value: "rear", label: "Rear" },
          ]}
        />
      </FacetField>

      <FacetField>
        <SliderFacet
          label="Lens / focal length"
          values={options.lens}
          filter={filters.lens}
          formatValue={formatLens}
          onChange={(min, max) => setFacetFilter("lens", { min, max })}
        />
      </FacetField>

      <FacetField>
        <CheckboxFacetGroup
          facetKey="iso"
          label="ISO"
          options={options.iso}
          selected={filters.iso}
          formatLabel={(value) => String(value)}
          onToggle={(value) => setFacetFilter("iso", toggleInArray(filters.iso, value))}
        />
      </FacetField>

      <FacetField>
        <CheckboxFacetGroup
          facetKey="year"
          label="Year"
          options={options.years}
          selected={filters.years}
          formatLabel={(value) => String(value)}
          onToggle={(value) => setFacetFilter("years", toggleInArray(filters.years, value))}
        />
      </FacetField>

      <FacetField>
        <SliderFacet
          label="Aperture"
          values={options.aperture}
          filter={filters.aperture}
          formatValue={formatAperture}
          onChange={(min, max) => setFacetFilter("aperture", { min, max })}
        />
      </FacetField>

      <FacetField>
        <SliderFacet
          label="Shutter speed"
          values={options.shutter}
          filter={filters.shutter}
          formatValue={formatShutterSpeed}
          onChange={(min, max) => setFacetFilter("shutter", { min, max })}
        />
      </FacetField>

      <FacetField>
        <CheckboxFacetGroup
          facetKey="exposure-comp"
          label="Exposure comp (EV)"
          options={options.exposureComp}
          selected={filters.exposureComp}
          formatLabel={formatExposureComp}
          onToggle={(value) => setFacetFilter("exposureComp", toggleInArray(filters.exposureComp, value))}
        />
      </FacetField>

      <FacetField>
        <CheckboxFacetGroup
          facetKey="megapixel"
          label="Megapixel mode"
          options={options.megapixelMode}
          selected={filters.megapixelMode}
          formatLabel={formatMegapixelMode}
          onToggle={(value) => setFacetFilter("megapixelMode", toggleInArray(filters.megapixelMode, value))}
        />
      </FacetField>

      <Button type="button" variant="outline" onClick={clearAllFacetFilters}>
        Clear filters
      </Button>
    </div>
  );
}
