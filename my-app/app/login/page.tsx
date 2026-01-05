import LoginForm from "../components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 pt-20">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
          <section className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
              Welcome back
            </p>
            <h1 className="text-3xl sm:text-[2.3rem] font-semibold text-gray-900 leading-tight tracking-tight">
              Sign in to TruthLens
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-md">
              Pick up where you left off. Access your saved articles, verify
              news stories, and keep your feed tailored to what matters to you.
            </p>
          </section>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
