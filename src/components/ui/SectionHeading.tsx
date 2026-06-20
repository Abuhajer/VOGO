import SectionLabel from "@/components/icons/SectionLabel";

type SectionHeadingProps = {
  label: string;
  title: string;
  className?: string;
  align?: "start" | "center";
};

export default function SectionHeading({
  label,
  title,
  className = "",
  align = "start",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-start items-start";

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <SectionLabel className="mb-2 text-gold font-light">{label}</SectionLabel>
      <h2 className="text-3xl md:text-5xl font-serif font-light text-ivory leading-tight max-w-xl">
        {title}
      </h2>
    </div>
  );
}
