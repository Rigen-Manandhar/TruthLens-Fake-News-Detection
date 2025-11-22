export default function Footer() {
  return (
    <footer className="border-t border-gray-200 pt-6 mt-4 text-xs text-gray-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="font-semibold text-gray-700">TruthLens</div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="hover:text-gray-700 cursor-default">About</span>
          <span className="hover:text-gray-700 cursor-default">Contact</span>
          <span className="hover:text-gray-700 cursor-default">Privacy</span>
          <span className="hover:text-gray-700 cursor-default">Terms</span>
        </div>
        <div className="text-gray-400">
          © {new Date().getFullYear()} TruthLens Media
        </div>
      </div>
    </footer>
  );
}


