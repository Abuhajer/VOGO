import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-void">
      <p className="text-gold text-3xl mb-4" aria-hidden>
        ⚜
      </p>
      <h1 className="text-2xl font-serif text-ivory mb-3">404</h1>
      <p className="text-sm text-ivory-muted mb-8 max-w-md">
        الصفحة غير موجودة · Page not found
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/ar"
          className="px-6 py-3 bg-gold text-[#0E0D12] text-xs font-semibold rounded-sm"
        >
          العربية
        </Link>
        <Link
          href="/en"
          className="px-6 py-3 border border-gold-muted text-gold text-xs font-semibold rounded-sm"
        >
          English
        </Link>
      </div>
    </main>
  );
}
