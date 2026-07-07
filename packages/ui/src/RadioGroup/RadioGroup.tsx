import { FieldError } from "../Field/FieldError";

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  error?: string;
}

export function RadioGroup({
  name,
  label,
  required = false,
  value,
  onChange,
  options,
  disabled = false,
  error,
}: RadioGroupProps) {
  return (
    <fieldset>
      <legend className="mb-2 block text-data-label text-muted2 uppercase">
        {label}
        {required && <span className="text-error"> *</span>}
      </legend>
      <div className="flex flex-col gap-4">
        {options.map((option) => {
          const isChecked = option.value === value;
          const optionId = `${name}-${option.value}`;
          const borderClassName =
            error !== undefined ? "border-error" : isChecked ? "border-accent" : "border-dim";
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={() => onChange(option.value)}
                required={required}
                disabled={disabled}
                aria-invalid={error !== undefined}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-5 flex-none items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${borderClassName}`}
              >
                {isChecked && (
                  <span className={`size-2 ${error !== undefined ? "bg-error" : "bg-accent"}`} />
                )}
              </span>
              <span className="text-body text-fg">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error !== undefined && <FieldError error={error} />}
    </fieldset>
  );
}
