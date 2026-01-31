export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
            Account
          </p>
          <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-gray-900 leading-tight tracking-tight">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Manage your profile preferences and security settings.
          </p>
        </div>

        <section className="mt-8 rounded-2xl bg-white/90 backdrop-blur border border-gray-100 shadow-lg p-6 sm:p-8">
          <p className="text-sm text-gray-600">
            Settings options will appear here.
          </p>
        </section>
      </main>
    </div>
  );
}
