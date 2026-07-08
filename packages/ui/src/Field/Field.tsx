import { EyeIcon } from "@heroicons/react/24/solid";
import { EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState, type ChangeEvent } from "react";
import { FieldError } from "./FieldError";

export interface FieldProps {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}

export function Field({
  id,
  label,
  type = "text",
  required = false,
  value,
  onChange,
  defaultValue,
  error,
  disabled = false,
}: FieldProps) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const currentValue = isControlled ? value : uncontrolledValue;
  // Native date/time-family inputs always render their own placeholder mask
  // (e.g. "dd.mm.yyyy") regardless of value/focus, unlike text inputs which
  // render nothing when empty — so the label must always float for these
  // types, or it visually collides with that mask (bug found via live
  // verification, 2026-07-08).
  const alwaysFloats = type === "date" || type === "time" || type === "month" || type === "week" || type === "datetime-local";
  const isFloating = isFocused || currentValue.length > 0 || alwaysFloats;
  const isPasswordType = type === "password";
  const inputType = isPasswordType && isPasswordVisible ? "text" : type;
  const borderClassName = error !== undefined ? "border-error" : "border-dim focus:border-accent";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          required={required}
          disabled={disabled}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={error !== undefined}
          className={`peer w-full border-0 border-b-2 bg-transparent pt-5 pb-2 text-body text-fg caret-accent outline-none transition-colors disabled:opacity-60 ${
            isPasswordType ? "pr-8" : ""
          } ${borderClassName}`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-0 uppercase text-data-label text-muted2 transition-all ${
            isFloating ? "top-0" : "top-6"
          }`}
        >
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
        {isPasswordType && (
          <button
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute right-0 bottom-2 p-1 text-muted2 transition-colors hover:text-accent"
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        )}
      </div>
      {error !== undefined && <FieldError error={error} />}
    </div>
  );
}
