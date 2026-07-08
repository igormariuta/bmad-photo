import { useState, type ReactNode } from "react";
import { Button, RadioGroup, Select } from "@bmad/ui";
import {
  clearAllFacetFilters,
  setFacetFilter,
  useFacetFilters,
  useLensOptions,
  useNumericFacetBounds,
  type RangeFilter,
} from "../../store/ingestStore";
import { RangeControl } from "./RangeControl";

function rangeToStrings(range: RangeFilter): [string, string] {
  return [range.min === undefined ? "" : String(range.min), range.max === undefined ? "" : String(range.max)];
}

function stringsToRange(min: string, max: string): RangeFilter {
  return {
    min: min === "" ? undefined : Number(min),
    max: max === "" ? undefined : Number(max),
  };
}

/** Exported for unit testing — the display text a user actually sees on a
 * collapsed range Facet's summary trigger. */
export function summarizeRange(min: string, max: string, unbounded: string): string {
  if (min === "" && max === "") {
    return unbounded;
  }
  if (min !== "" && max !== "") {
    return `${min}–${max}`;
  }
  return min !== "" ? `≥${min}` : `≤${max}`;
}

interface FacetFieldProps {
  label: string;
  summary: string;
  children: ReactNode;
}

/**
 * Collapsed summary trigger (`data-label` + current value + chevron) that
 * expands to the real control on interaction, per the mockup's
 * collapsed/expandable facet-field pattern (Dev Notes). Independent
 * per-field open state — Dev Notes only rule out all 8 being open at once
 * by default, not a strict single-open accordion.
 *
 * The outer `data-label` only renders while collapsed — every child control
 * (Select/RadioGroup/RangeControl) already renders its own label/legend, so
 * showing both at once produced a literal duplicate ("MEGAPIXEL MODE" twice)
 * once expanded (user-reported fix, 2026-07-08). Expanded state instead
 * shows just a small collapse affordance.
 */
function FacetField({ label, summary, children }: FacetFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isExpanded) {
    return (
      <div className="border-b-2 border-dim pb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-expanded
          className="mb-1 flex w-full items-center justify-end text-muted2 hover:text-fg"
        >
          <span aria-hidden="true" className="-rotate-180">
            ▾
          </span>
          <span className="sr-only">Collapse {label}</span>
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="border-b-2 border-dim pb-2">
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-expanded={false}
        className="flex w-full flex-col items-start gap-2 text-left"
      >
        <span className="text-data-label text-muted2 uppercase">{label}</span>
        <span className="flex w-full items-center justify-between text-body text-fg">
          {summary}
          <span aria-hidden="true" className="text-muted2">
            ▾
          </span>
        </span>
      </button>
    </div>
  );
}

/**
 * Fills Story 3.2's reserved sidebar region (desktop only — the mobile
 * slide-up-sheet requirement from AC #1/#4 is deferred, see deferred-work.md).
 * The 8 Facets (Dev Notes' field mapping), each behind a FacetField
 * collapse trigger; every control commits directly to the store on change
 * (AC #4, no Apply step).
 */
export function FacetPanel() {
  const filters = useFacetFilters();
  const lensOptions = useLensOptions();
  const bounds = useNumericFacetBounds();

  const [isoMin, isoMax] = rangeToStrings(filters.iso);
  const [apertureMin, apertureMax] = rangeToStrings(filters.aperture);
  const [shutterMin, shutterMax] = rangeToStrings(filters.shutter);
  const [exposureCompMin, exposureCompMax] = rangeToStrings(filters.exposureComp);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-eyebrow text-accent uppercase">// FACETS</p>

      <FacetField label="Lens / focal length" summary={filters.lens ?? "All lenses"}>
        <Select
          id="facet-lens"
          label="Lens / focal length"
          placeholder="All lenses"
          options={lensOptions.map((label) => ({ value: label, label }))}
          value={filters.lens ?? ""}
          onChange={(value) =>
            setFacetFilter("lens", typeof value === "string" && value !== "" ? value : undefined)
          }
        />
      </FacetField>

      <FacetField
        label="ISO"
        summary={summarizeRange(isoMin, isoMax, "All ISO")}
      >
        <RangeControl
          id="facet-iso"
          dataLabel="ISO"
          min={isoMin}
          max={isoMax}
          onChange={(min, max) => setFacetFilter("iso", stringsToRange(min, max))}
          sliderBounds={[bounds.isoMin, bounds.isoMax]}
        />
      </FacetField>

      <FacetField
        label="Date range"
        summary={summarizeRange(filters.dateFrom ?? "", filters.dateTo ?? "", "All time")}
      >
        <RangeControl
          id="facet-date"
          dataLabel="Date range"
          type="date"
          min={filters.dateFrom ?? ""}
          max={filters.dateTo ?? ""}
          onChange={(from, to) => {
            setFacetFilter("dateFrom", from === "" ? undefined : from);
            setFacetFilter("dateTo", to === "" ? undefined : to);
          }}
        />
      </FacetField>

      <FacetField
        label="Aperture"
        summary={summarizeRange(apertureMin, apertureMax, "All apertures")}
      >
        <RangeControl
          id="facet-aperture"
          dataLabel="Aperture (f/)"
          onChange={(min, max) => setFacetFilter("aperture", stringsToRange(min, max))}
          min={apertureMin}
          max={apertureMax}
          sliderBounds={[bounds.apertureMin, bounds.apertureMax]}
          sliderStep={0.1}
        />
      </FacetField>

      <FacetField
        label="Shutter speed"
        summary={summarizeRange(shutterMin, shutterMax, "All shutter speeds")}
      >
        <RangeControl
          id="facet-shutter"
          dataLabel="Shutter speed (sec)"
          min={shutterMin}
          max={shutterMax}
          onChange={(min, max) => setFacetFilter("shutter", stringsToRange(min, max))}
          sliderBounds={[bounds.shutterMin, bounds.shutterMax]}
          sliderStep={0.001}
        />
      </FacetField>

      <FacetField
        label="Exposure comp"
        summary={summarizeRange(exposureCompMin, exposureCompMax, "All exposure comp")}
      >
        <RangeControl
          id="facet-exposure-comp"
          dataLabel="Exposure comp (EV)"
          min={exposureCompMin}
          max={exposureCompMax}
          onChange={(min, max) => setFacetFilter("exposureComp", stringsToRange(min, max))}
          sliderBounds={[bounds.exposureCompMin, bounds.exposureCompMax]}
          sliderStep={0.1}
        />
      </FacetField>

      <FacetField
        label="Megapixel mode"
        summary={filters.megapixelMode === undefined ? "All" : `${filters.megapixelMode} MP`}
      >
        <RadioGroup
          name="facet-megapixel"
          label="Megapixel mode"
          value={filters.megapixelMode === undefined ? "all" : String(filters.megapixelMode)}
          onChange={(value) =>
            setFacetFilter("megapixelMode", value === "all" ? undefined : (Number(value) as 12 | 48))
          }
          options={[
            { value: "all", label: "All" },
            { value: "12", label: "12 MP (standard)" },
            { value: "48", label: "48 MP (ProRAW)" },
          ]}
        />
      </FacetField>

      <FacetField
        label="Camera"
        summary={
          filters.camera === undefined ? "All" : filters.camera === "front" ? "Front (selfie)" : "Rear"
        }
      >
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
