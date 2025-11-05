export default function Loader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-indigo-100"></div>
        </div>
      </div>
      <p className="ml-4 text-gray-600">Analyzing episode...</p>
    </div>
  );
}
