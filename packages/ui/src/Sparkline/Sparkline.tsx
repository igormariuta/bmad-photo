export interface SparklineProps {
  series: number[];
  /** Must be unique per instance — two gradients with the same id collide in the DOM. */
  gradientId: string;
  ariaLabel: string;
}

const VB_W = 100;
const VB_H = 52;
const PAD_TOP = 4;
// Catmull-Rom can dip below the lowest point — extra room avoids clipping.
const PAD_BOTTOM = 8;
const PLOT_H = 46;

const px = (i: number, len: number) => (len > 1 ? (i / (len - 1)) * VB_W : VB_W / 2);
const py = (value: number, max: number) => PAD_TOP + (1 - value / max) * (VB_H - PAD_TOP - PAD_BOTTOM);

type Point = { x: number; y: number };

function smoothPath(points: Point[]): string {
  const [head, ...rest] = points;
  if (!head) return "";
  if (rest.length === 0) return `M ${head.x} ${head.y}`;

  let d = `M ${head.x} ${head.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** An all-zero series renders a muted flat baseline with no accent/gradient; any non-zero
 * point renders the accent curve + dots + gradient fill. */
export function Sparkline({ series, gradientId, ariaLabel }: SparklineProps) {
  const max = Math.max(1, ...series);
  const empty = series.every((value) => value === 0);
  const tone = empty ? "var(--m-muted2)" : "var(--m-accent)";
  const points = series.map((value, i) => ({ x: px(i, series.length), y: py(value, max) }));
  const line = smoothPath(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const area =
    firstPoint && lastPoint
      ? `${line} L ${lastPoint.x} ${VB_H} L ${firstPoint.x} ${VB_H} Z`
      : "";

  return (
    <div className="relative w-full overflow-visible" style={{ height: PLOT_H }} role="img" aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--m-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--m-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {!empty && <path d={area} fill={`url(#${gradientId})`} />}
        <path
          d={line}
          fill="none"
          stroke={tone}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {points.map((point, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${point.x}%`, top: `${(point.y / VB_H) * 100}%`, backgroundColor: tone }}
        />
      ))}
    </div>
  );
}
