import { Console } from "../Console/Console";
import { Button } from "../Button/Button";

export interface ErrorMessageProps {
  error: Error;
  status: number;
}

/** Full-viewport error/404 layout. Uses a plain static heading rather than the reference's
 * GlitchText — this suite has no other error-page consumer, so GlitchText stays Landing-local
 * (see Story 4.1) instead of becoming a shared dependency for a single caller. */
export function ErrorMessage({ error, status }: ErrorMessageProps) {
  const statusLine = status === 404 ? "NOT FOUND · 404" : `RUNTIME EXCEPTION · ${status}`;

  return (
    <div className="flex min-h-screen w-full flex-col justify-center bg-bg px-10 py-14 text-fg">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-2.5 text-eyebrow text-error">
          <span aria-hidden="true" className="inline-block size-2 bg-error" />
          {statusLine}
        </div>

        <h1 className="font-display text-h1 text-fg">A glitch in the Lazyverse</h1>

        <p className="mt-4 text-body text-muted">
          Something broke. A sloth has been notified and hit snooze.
        </p>

        <Console title="stacktrace.log" className="mt-6">
          <span className="text-error">Error</span>
          {": "}
          <span className="text-fg">{error.message}</span>
        </Console>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/">Go home</Button>
        </div>
      </div>
    </div>
  );
}
