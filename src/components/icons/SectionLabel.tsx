import { PrimeMarkIcon } from "./Icons";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-gold-muted font-sans font-medium ${className}`}
    >
      <PrimeMarkIcon size={12} className="text-gold shrink-0" />
      {children}
    </span>
  );
}
