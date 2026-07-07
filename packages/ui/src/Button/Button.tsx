import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentType,
  ReactNode,
  SVGProps,
} from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Spinner } from "../Spinner/Spinner";

export type ButtonVariant = "primary" | "outline" | "danger";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Renders as the plain icon-only pattern; `children` becomes the required `aria-label` instead of visible text. */
  iconOnly?: boolean;
  children: ReactNode;
}

type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
    href?: undefined;
    type?: "button" | "submit";
  };

type ButtonAsAnchorProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & { href: string };

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const VARIANT_CLASS_NAME: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-bg hover:bg-transparent hover:text-accent",
  outline: "border-dim text-muted hover:border-accent hover:text-accent",
  danger: "border-error bg-error text-bg hover:bg-transparent hover:text-error",
};

export const BUTTON_CLASS_NAME =
  "inline-flex h-control-height items-center justify-center gap-2 border-2 px-4 font-display text-body leading-none uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-60";

/**
 * The plain (non-form) icon-button pattern — reused as-is by the Theme-toggle
 * in Story 1.5. Not a packaged component of its own, just a class recipe
 * applied to a native <button type="button">.
 */
export const ICON_BUTTON_CLASS_NAME =
  "flex flex-none items-center justify-center border-2 border-dim text-muted transition-colors hover:border-accent hover:text-accent";

export function Button({
  variant = "primary",
  fullWidth = false,
  pending = false,
  pendingLabel,
  icon: Icon = PaperAirplaneIcon,
  iconOnly = false,
  children,
  href,
  ...rest
}: ButtonProps) {
  if (href !== undefined) {
    const className = [BUTTON_CLASS_NAME, VARIANT_CLASS_NAME[variant], fullWidth && "w-full"]
      .filter(Boolean)
      .join(" ");
    return (
      <a href={href} className={className} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  const { type = "button", disabled, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement> & {
    type?: "button" | "submit";
  };
  const isDisabled = Boolean(disabled) || pending;

  if (iconOnly) {
    return (
      <button
        type={type}
        aria-label={children as string}
        disabled={isDisabled}
        className={`${ICON_BUTTON_CLASS_NAME} size-9`}
        {...buttonRest}
      >
        {pending ? <Spinner className="text-body" /> : <Icon className="size-4" />}
      </button>
    );
  }

  const className = [BUTTON_CLASS_NAME, VARIANT_CLASS_NAME[variant], fullWidth && "w-full"]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} disabled={isDisabled} className={className} {...buttonRest}>
      {pending && <Spinner className="text-body" />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
