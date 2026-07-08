import type { ReactNode } from "react";
import { Button, Checkbox, RadioGroup } from "@bmad/ui";
import {
  clearAllFacetFilters,
  setFacetFilter,
  toggleInArray,
  useFacetFilters,
  useFacetValueOptions,
  type RangeFilter,
} from "../../store/ingestStore";
import { RangeSlider } from "./RangeSlider";

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

/**
 * A divider between Facets — no label of its own (UX fix, 2026-07-08:
 * every child control already renders its own label). Always shows the
 * real control, never a collapsed summary.
 */
function FacetField({ children }: { children: ReactNode }) {
  return <div className="border-b-2 border-dim pb-4">{children}</div>;
}

interface CheckboxFacetGroupProps<T extends string | number> {
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
 * existing "No data for this batch." convention.
 */
function CheckboxFacetGroup<T extends string | number>({
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

/** The one Facet still slider-driven (user request, 2026-07-08) — too many
 * distinct raw shutter-speed values for a usable checkbox list. The slider
 * itself snaps only to indices into the sorted distinct values actually
 * present (not a continuous numeric range), so it can never land on a
 * shutter speed that doesn't exist in the batch. */
function ShutterFacet({
  values,
  filter,
  onChange,
}: {
  values: readonly number[];
  filter: RangeFilter;
  onChange: (min: number, max: number) => void;
}) {
  if (values.length === 0) {
    return (
      <div>
        <div className="mb-2 text-data-label text-muted2 uppercase">Shutter speed</div>
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

  return (
    <div>
      <div className="mb-2 text-data-label text-muted2 uppercase">Shutter speed</div>
      <RangeSlider
        min={0}
        max={lastIndex}
        step={1}
        valueMin={minIndex}
        valueMax={maxIndex}
        onChange={(i, j) => onChange(values[i] ?? firstValue, values[j] ?? lastValue)}
      />
      <p className="mt-3 text-body text-fg">
        {formatShutterSpeed(minValue)} – {formatShutterSpeed(maxValue)}
      </p>
    </div>
  );
}

/**
 * Fills the persistent global sidebar (App.tsx) — desktop only, the mobile
 * slide-up-sheet requirement from AC #1/#4 is deferred (see
 * deferred-work.md). The 8 Facets (Dev Notes' field mapping), each always
 * showing its real control; every control commits directly to the store on
 * change (AC #4, no Apply step).
 */
export function FacetPanel() {
  const filters = useFacetFilters();
  const options = useFacetValueOptions();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-eyebrow text-accent uppercase">// FACETS</p>

      <FacetField>
        <CheckboxFacetGroup
          facetKey="lens"
          label="Lens / focal length"
          options={options.lens}
          selected={filters.lens}
          formatLabel={(value) => value}
          onToggle={(value) => setFacetFilter("lens", toggleInArray(filters.lens, value))}
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
        <CheckboxFacetGroup
          facetKey="aperture"
          label="Aperture"
          options={options.aperture}
          selected={filters.aperture}
          formatLabel={(value) => `f/${value}`}
          onToggle={(value) => setFacetFilter("aperture", toggleInArray(filters.aperture, value))}
        />
      </FacetField>

      <FacetField>
        <ShutterFacet
          values={options.shutter}
          filter={filters.shutter}
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

      <Button type="button" variant="outline" onClick={clearAllFacetFilters}>
        Clear filters
      </Button>
    </div>
  );
}
