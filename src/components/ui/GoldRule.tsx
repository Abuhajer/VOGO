type GoldRuleProps = {
  className?: string;
};

export default function GoldRule({ className = "" }: GoldRuleProps) {
  return (
    <div
      className={`h-px w-24 md:w-36 bg-gradient-to-r from-transparent via-gold to-transparent origin-center ${className}`}
      aria-hidden
    />
  );
}
