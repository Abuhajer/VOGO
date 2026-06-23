import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  hint?: string;
  className?: string;
};

export default function AdminTableScroll({ children, hint, className = "" }: Props) {
  return (
    <div className={`admin-table-wrap overflow-hidden rounded-sm border border-gold-glow/15 bg-obsidian ${className}`.trim()}>
      {hint ? (
        <p className="admin-table-scroll-hint border-b border-gold-glow/10 px-4 py-2 text-[10px] text-ivory-faint md:hidden">
          {hint}
        </p>
      ) : null}
      <div className="admin-table-scroll overflow-x-auto">{children}</div>
    </div>
  );
}
