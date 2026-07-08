import { CheckIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { FieldError } from "../Field/FieldError";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

const TYPEAHEAD_RESET_MS = 500;

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(index, 0), length - 1);
}

export function Select({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  multiple = false,
  required = false,
  disabled = false,
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const listboxId = `${id}-listbox`;
  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
      ? [value as string]
      : [];
  const hasValue = selectedValues.length > 0;
  const borderClassName =
    error !== undefined ? "border-error" : "border-dim focus:border-accent";

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const node = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  function getDisplayLabel(): string {
    if (multiple) {
      const labels = selectedValues
        .map((selectedValue) => options.find((option) => option.value === selectedValue)?.label)
        .filter((optionLabel): optionLabel is string => Boolean(optionLabel));
      return labels.length > 0 ? labels.join(", ") : (placeholder ?? "");
    }
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? placeholder ?? "";
  }

  function findInitialActiveIndex() {
    const index = options.findIndex((option) => selectedValues.includes(option.value));
    return index !== -1 ? index : 0;
  }

  function commitOption(option: SelectOption) {
    if (multiple) {
      const isSelected = selectedValues.includes(option.value);
      const nextValues = isSelected
        ? selectedValues.filter((selectedValue) => selectedValue !== option.value)
        : [...selectedValues, option.value];
      onChange(nextValues);
      return;
    }
    onChange(option.value);
    setIsOpen(false);
  }

  function handleTypeahead(char: string) {
    typeaheadRef.current += char.toLowerCase();
    clearTimeout(typeaheadTimeoutRef.current);
    typeaheadTimeoutRef.current = setTimeout(() => {
      typeaheadRef.current = "";
    }, TYPEAHEAD_RESET_MS);
    const matchIndex = options.findIndex((option) =>
      option.label.toLowerCase().startsWith(typeaheadRef.current),
    );
    if (matchIndex !== -1) {
      setIsOpen(true);
      setActiveIndex(matchIndex);
    }
  }

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(findInitialActiveIndex());
        } else {
          setActiveIndex((index) => clampIndex(index + 1, options.length));
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(findInitialActiveIndex());
        } else {
          setActiveIndex((index) => clampIndex(index - 1, options.length));
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(findInitialActiveIndex());
        } else {
          const activeOption = options[activeIndex];
          if (activeOption) {
            commitOption(activeOption);
          }
        }
        break;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        break;
      default:
        if (event.key.length === 1) {
          handleTypeahead(event.key);
        }
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleContainerBlur}>
      <span className="mb-2 block text-data-label text-muted2 uppercase">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-required={required}
        aria-invalid={error !== undefined}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 border-0 border-b-2 bg-transparent pt-1 pb-2 text-left text-body outline-none transition-colors disabled:opacity-60 ${
          hasValue ? "text-fg" : "text-muted2"
        } ${borderClassName}`}
      >
        <span className="truncate">{getDisplayLabel()}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className={`size-3.5 flex-none text-muted2 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-multiselectable={multiple}
          style={{ zIndex: "var(--m-z-dropdown)" }}
          className="absolute inset-x-0 mt-1 max-h-60 overflow-auto border-2 border-dim bg-card"
        >
          {options.map((option, index) => {
            const isSelected = selectedValues.includes(option.value);
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                // A non-focusable <li> click still fires a native mousedown
                // first; without preventDefault the browser blurs the
                // trigger button (relatedTarget becomes null), which fires
                // handleContainerBlur and closes the dropdown — unmounting
                // this <li> before the click event it's still mid-dispatch
                // for ever reaches onClick below. Real, click-blocking bug
                // (only keyboard selection worked) — found via Story 3.3's
                // live Playwright verification, first real Select consumer
                // outside Storybook.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitOption(option)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-body ${
                  isActive ? "bg-accent text-bg" : "text-fg"
                }`}
              >
                {option.label}
                {isSelected && <CheckIcon className="size-4" />}
              </li>
            );
          })}
        </ul>
      )}
      {error !== undefined && <FieldError error={error} />}
    </div>
  );
}
