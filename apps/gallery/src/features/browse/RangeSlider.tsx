import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

type Thumb = "min" | "max";

/** Pure so the pixel→value mapping is unit-testable without a real DOM. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Pure — where a value sits along [min, max] as a 0–100 percentage, for
 * positioning a thumb/fill via inline `left`/`width` styles. */
export function percentFor(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  return (clamp(value, min, max) - min) / (max - min) * 100;
}

/** Pure — a pointer's x-ratio along the track, snapped to `step` and
 * clamped to [min, max]. */
export function valueFromRatio(ratio: number, min: number, max: number, step: number): number {
  const raw = min + clamp(ratio, 0, 1) * (max - min);
  return clamp(Math.round(raw / step) * step, min, max);
}

/**
 * Gallery-local dual-thumb range slider (user request, 2026-07-08) — a
 * quicker interaction than typing two exact numbers for ISO/aperture/
 * shutter/exposure-comp, paired with (not replacing) the two Fields
 * RangeControl already renders below it. Custom-built rather than the
 * classic two-overlapping-`<input type="range">` CSS trick, since making
 * only each thumb's pseudo-element clickable needs `::-webkit-slider-thumb`
 * selectors this repo's design tokens don't reach (and arbitrary Tailwind
 * values are hard-banned). No rounded corners, matching this design
 * system's zero-radius aesthetic (`--m-radius-default: 0`).
 */
export function RangeSlider({ min, max, step = 1, valueMin, valueMax, onChange }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<Thumb | null>(null);

  const valueFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) {
        return min;
      }
      const rect = track.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
      return valueFromRatio(ratio, min, max, step);
    },
    [min, max, step],
  );

  useEffect(() => {
    if (dragging === null) {
      return;
    }
    function handlePointerMove(event: globalThis.PointerEvent) {
      const value = valueFromClientX(event.clientX);
      if (dragging === "min") {
        onChange(clamp(Math.min(value, valueMax), min, max), valueMax);
      } else {
        onChange(valueMin, clamp(Math.max(value, valueMin), min, max));
      }
    }
    function handlePointerUp() {
      setDragging(null);
    }
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, valueFromClientX, onChange, valueMin, valueMax, min, max]);

  function handleTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
    const value = valueFromClientX(event.clientX);
    const nearerThumb: Thumb = Math.abs(value - valueMin) <= Math.abs(value - valueMax) ? "min" : "max";
    setDragging(nearerThumb);
  }

  function handleThumbKeyDown(thumb: Thumb) {
    return (event: KeyboardEvent) => {
      const delta =
        event.key === "ArrowRight" || event.key === "ArrowUp"
          ? step
          : event.key === "ArrowLeft" || event.key === "ArrowDown"
            ? -step
            : 0;
      if (delta === 0) {
        return;
      }
      event.preventDefault();
      if (thumb === "min") {
        onChange(clamp(valueMin + delta, min, valueMax), valueMax);
      } else {
        onChange(valueMin, clamp(valueMax + delta, valueMin, max));
      }
    };
  }

  const minPercent = percentFor(valueMin, min, max);
  const maxPercent = percentFor(valueMax, min, max);

  return (
    // Outer px-2 (8px, half of the size-4/16px thumb) — thumbs are centered
    // on their percent position via -translate-x-1/2, so at 0%/100% half a
    // thumb would otherwise overhang past the track's own edges. Inset by
    // exactly that padding makes the thumb's OUTER edge land flush with
    // this component's own bounding box instead of overflowing past it
    // (user-reported fix, 2026-07-08). trackRef and both thumbs share this
    // same padded box as their one coordinate space.
    <div className="px-2">
      <div ref={trackRef} className="relative flex h-4 items-center" onPointerDown={handleTrackPointerDown}>
        <div className="h-0.5 w-full bg-dim">
          <div
            className="h-full bg-accent"
            style={{ marginLeft: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Minimum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDragging("min");
          }}
          onKeyDown={handleThumbKeyDown("min")}
          className="absolute size-4 -translate-x-1/2 cursor-pointer border-2 border-accent bg-bg"
          style={{ left: `${minPercent}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Maximum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDragging("max");
          }}
          onKeyDown={handleThumbKeyDown("max")}
          className="absolute size-4 -translate-x-1/2 cursor-pointer border-2 border-accent bg-bg"
          style={{ left: `${maxPercent}%` }}
        />
      </div>
    </div>
  );
}

export interface SingleSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

/** One-thumb variant (user request, 2026-07-08 — a toggle switches a
 * slider-driven Facet between "pick one exact value" and "pick a range").
 * Shares the same pure pixel↔value helpers as RangeSlider and the same
 * flush-edge padding treatment. */
export function SingleSlider({ min, max, step = 1, value, onChange }: SingleSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const valueFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) {
        return min;
      }
      const rect = track.getBoundingClientRect();
      const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
      return valueFromRatio(ratio, min, max, step);
    },
    [min, max, step],
  );

  useEffect(() => {
    if (!dragging) {
      return;
    }
    function handlePointerMove(event: globalThis.PointerEvent) {
      onChange(valueFromClientX(event.clientX));
    }
    function handlePointerUp() {
      setDragging(false);
    }
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, valueFromClientX, onChange]);

  function handleTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
    onChange(valueFromClientX(event.clientX));
    setDragging(true);
  }

  function handleThumbKeyDown(event: KeyboardEvent) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? step
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -step
          : 0;
    if (delta === 0) {
      return;
    }
    event.preventDefault();
    onChange(clamp(value + delta, min, max));
  }

  const percent = percentFor(value, min, max);

  return (
    <div className="px-2">
      <div ref={trackRef} className="relative flex h-4 items-center" onPointerDown={handleTrackPointerDown}>
        <div className="h-0.5 w-full bg-dim">
          <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Value"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDragging(true);
          }}
          onKeyDown={handleThumbKeyDown}
          className="absolute size-4 -translate-x-1/2 cursor-pointer border-2 border-accent bg-bg"
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
}
