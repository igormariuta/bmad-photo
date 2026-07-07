import { CheckIcon } from "@heroicons/react/24/solid";
import { FieldError } from "../Field/FieldError";

export interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
}: CheckboxProps) {
  const borderClassName = error !== undefined ? "border-error" : checked ? "border-accent" : "border-dim";

  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required={required}
          disabled={disabled}
          aria-invalid={error !== undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`flex size-4.5 flex-none items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${borderClassName} ${
            checked ? (error !== undefined ? "bg-error" : "bg-accent") : "bg-transparent"
          }`}
        >
          {checked && <CheckIcon className="size-3.5 text-bg" />}
        </span>
        <span className="text-body text-fg">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
      </label>
      {error !== undefined && <FieldError error={error} />}
    </div>
  );
}
