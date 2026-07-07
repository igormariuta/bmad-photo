export interface FieldErrorProps {
  error: string;
}

export function FieldError({ error }: FieldErrorProps) {
  return (
    <p role="alert" className="mt-2 text-eyebrow text-error">
      ! {error}
    </p>
  );
}
