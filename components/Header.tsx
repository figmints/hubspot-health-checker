export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">HS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">HubSpot Health Checker</h1>
        </div>
      </nav>
    </header>
  );
}
