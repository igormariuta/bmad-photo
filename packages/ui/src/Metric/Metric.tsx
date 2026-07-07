import {
  HeartIcon,
  EyeIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

const ICONS = {
  likes: HeartIcon,
  views: EyeIcon,
  posts: DocumentTextIcon,
  comments: ChatBubbleLeftIcon,
} as const;

export type MetricKind = keyof typeof ICONS | "rating";

export interface MetricProps {
  kind: MetricKind;
  value: number;
  /** Highlights a just-changed value (e.g. a fresh up-vote). */
  accent?: boolean;
}

const fmt = (value: number) => value.toLocaleString("en-US");

/** `rating`'s icon is a neutral star that never changes with the value's sign — only the number does. */
export function Metric({ kind, value, accent = false }: MetricProps) {
  const Icon = kind === "rating" ? StarIcon : ICONS[kind];

  return (
    <span
      className={`inline-flex items-center gap-1 text-caption tabular-nums ${accent ? "text-accent" : "text-muted"}`}
    >
      <Icon
        aria-label={kind === "rating" ? "Rating" : undefined}
        role={kind === "rating" ? "img" : undefined}
        className="size-3.5 shrink-0"
      />
      {fmt(value)}
    </span>
  );
}
