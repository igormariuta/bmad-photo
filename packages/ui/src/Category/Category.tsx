export interface CategoryProps {
  children: string;
  className?: string;
}

export function Category({ children, className = "" }: CategoryProps) {
  return (
    <span className={`text-eyebrow text-accent uppercase ${className}`}>[ {children} ]</span>
  );
}
