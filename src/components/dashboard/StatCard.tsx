type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "gold" | "ivory" | "emerald";
};

const accentClass = {
  gold: "text-gold",
  ivory: "text-ivory",
  emerald: "text-emerald-300",
};

export default function StatCard({ label, value, hint, accent = "gold" }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian p-5 md:p-6">
      <div
        className="pointer-events-none absolute -top-8 end-0 h-24 w-24 rounded-full bg-gold/10 blur-2xl"
        aria-hidden
      />
      <p className="text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{label}</p>
      <p className={`mt-3 font-serif text-3xl md:text-4xl ${accentClass[accent]}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-ivory-muted">{hint}</p> : null}
    </div>
  );
}
