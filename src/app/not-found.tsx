export default function RootNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-void">
      <p className="text-gold text-3xl mb-4" aria-hidden>
        ⚜
      </p>
      <h1 className="text-2xl font-serif text-ivory mb-3">Page not found</h1>
      <p className="text-sm text-ivory-muted mb-8 max-w-md">
        The page you requested does not exist.
      </p>
      <a
        href="/ar"
        className="px-8 py-3 bg-gold text-[#0E0D12] text-xs font-semibold uppercase tracking-wider rounded-sm"
      >
        Return Home
      </a>
    </main>
  );
}
