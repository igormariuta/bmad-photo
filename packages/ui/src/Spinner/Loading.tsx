import { Spinner } from "./Spinner";

export interface LoadingProps {
  /** Centers the spinner inline in flow instead of filling the viewport. */
  inline?: boolean;
  /** With `inline`, uses a smaller top margin suited to a page section rather than a full route. */
  section?: boolean;
}

export function Loading({ inline = false, section = false }: LoadingProps) {
  const glyph = <Spinner className="text-body font-bold text-accent" />;

  if (inline) {
    return <div className={`flex justify-center ${section ? "mt-5" : "my-6"}`}>{glyph}</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-3">
      {glyph}
      <span className="text-eyebrow text-muted2 uppercase">Loading</span>
    </div>
  );
}
