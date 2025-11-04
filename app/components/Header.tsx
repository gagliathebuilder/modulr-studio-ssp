export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            Contextual Intelligence Platform
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Publisher Dashboard</span>
          </div>
        </div>
      </div>
    </header>
  );
}
