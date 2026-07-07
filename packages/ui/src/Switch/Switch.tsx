import { FieldError } from "../Field/FieldError";

export interface SwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function Switch({
  id,
  label,
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
}: SwitchProps) {
  const trackClassName =
    error !== undefined
      ? "border-error bg-error"
      : checked
        ? "border-accent bg-accent"
        : "border-dim bg-transparent";

  return (
    <div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-required={required}
        aria-invalid={error !== undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`flex w-full items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        <span
          aria-hidden="true"
          className={`relative flex h-4.5 w-9 flex-none items-center border-2 transition-colors ${trackClassName}`}
        >
          <span
            className={`absolute size-2.5 transition-all duration-150 ${
              checked ? "left-5 bg-bg" : "left-0.5 bg-muted2"
            }`}
          />
        </span>
        <span className="text-eyebrow text-fg uppercase">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
      </button>
      {error !== undefined && <FieldError error={error} />}
    </div>
  );
}
