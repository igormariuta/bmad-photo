import type { ReactNode } from "react";
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

/**
 * A divider between Facets — no label of its own (UX fix, 2026-07-08:
 * every child control — Select/RadioGroup/RangeControl — already renders
 * its own label, and a collapse/expand toggle previously duplicated it and
 * hid the real control behind an extra click). The control is always
 * rendered directly, at a fixed position, never swapped for a summary line.
 */
function FacetField({ children }: { children: ReactNode }) {
  return <div className="border-b-2 border-dim pb-4">{children}</div>;
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
  const lensOptions = useLensOptions();
  const bounds = useNumericFacetBounds();

  const [isoMin, isoMax] = rangeToStrings(filters.iso);
  const [apertureMin, apertureMax] = rangeToStrings(filters.aperture);
  const [shutterMin, shutterMax] = rangeToStrings(filters.shutter);
  const [exposureCompMin, exposureCompMax] = rangeToStrings(filters.exposureComp);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-eyebrow text-accent uppercase">// FACETS</p>

      <FacetField>
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

      <FacetField>
        <RangeControl
          id="facet-iso"
          dataLabel="ISO"
          min={isoMin}
          max={isoMax}
          onChange={(min, max) => setFacetFilter("iso", stringsToRange(min, max))}
          sliderBounds={[bounds.isoMin, bounds.isoMax]}
        />
      </FacetField>

      <FacetField>
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

      <FacetField>
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

      <FacetField>
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

      <FacetField>
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

      <FacetField>
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
