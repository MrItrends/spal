/**
 * Offline fallback page — shown by the service worker when the user
 * navigates to a page that isn't in cache and has no internet connection.
 */
export default function OfflinePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 px-8 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-4xl">
        📵
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold text-spal-navy font-[family-name:var(--font-satoshi)]">
          No internet right now
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Come back when you&apos;re connected — your data will be waiting for you.
        </p>
      </div>

      {/* Retry link */}
      <a
        href="/home"
        className="px-6 py-3 bg-spal-green text-white text-sm font-semibold rounded-2xl"
      >
        Try again
      </a>
    </div>
  );
}

