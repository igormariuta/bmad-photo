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
    <div className="relative flex h-4 items-center" onPointerDown={handleTrackPointerDown}>
      <div ref={trackRef} className="relative h-0.5 w-full bg-dim">
        <div
          className="absolute h-full bg-accent"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
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
  );
}
