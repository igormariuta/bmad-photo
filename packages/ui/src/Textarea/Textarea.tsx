import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { FieldError } from "../Field/FieldError";

export interface TextareaProps {
  id: string;
  label: string;
  required?: boolean;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}

export function Textarea({
  id,
  label,
  required = false,
  value,
  onChange,
  defaultValue,
  error,
  disabled = false,
}: TextareaProps) {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentValue = isControlled ? value : uncontrolledValue;
  const isFloating = isFocused || currentValue.length > 0;
  const borderClassName = error !== undefined ? "border-error" : "border-dim focus:border-accent";

  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [currentValue]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  }

  return (
    <div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          required={required}
          disabled={disabled}
          rows={1}
          value={isControlled ? value : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={error !== undefined}
          className={`peer w-full resize-none overflow-hidden border-0 border-b-2 bg-transparent pt-5 pb-2 text-body text-fg caret-accent outline-none transition-colors disabled:opacity-60 ${borderClassName}`}
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
      </div>
      {error !== undefined && <FieldError error={error} />}
    </div>
  );
}
