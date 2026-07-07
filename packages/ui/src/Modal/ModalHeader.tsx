export interface ModalHeaderProps {
  eyebrow?: string;
  title: string;
  titleId: string;
  subtitle?: string;
  onClose: () => void;
  /** Full override for the eyebrow's default accent styling (e.g. ConfirmModal's danger tone). */
  eyebrowClassName?: string;
}

export function ModalHeader({
  eyebrow,
  title,
  titleId,
  subtitle,
  onClose,
  eyebrowClassName = "text-eyebrow text-accent uppercase",
}: ModalHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <div className={`mb-6 ${eyebrowClassName}`}>{eyebrow}</div> : null}
        <h2 id={titleId} className="font-display text-h1 text-fg">
          {title}
        </h2>
        {subtitle ? <p className="mt-4 text-body text-muted">{subtitle}</p> : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="-mt-1.5 -mr-2 flex size-9 shrink-0 items-center justify-center text-h3 text-muted2 transition-colors hover:bg-panel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
