import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Modulr Studio
          </h1>
          <p className="text-xl text-gray-600">
            Transform your podcast content into monetizable inventory with
            contextual intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Episodes Analyzed
            </h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-2">Start analyzing episodes</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Average CPM Lift
            </h3>
            <p className="text-3xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-500 mt-2">Requires analysis data</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Fill Rate
            </h3>
            <p className="text-3xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-500 mt-2">Requires analysis data</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl">
            Start by analyzing your first podcast episode. Our AI-powered engine
            will extract topics, entities, IAB categories, and brand safety scores
            to enrich your inventory for programmatic advertising.
          </p>
          <Link
            href="/analyze"
            className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Analyze Episode →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contextual Intelligence
            </h3>
            <p className="text-gray-600">
              Extract episode-level insights including topics, entities, tone,
              and sentiment to make your content more discoverable to advertisers.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              SSP-Ready Enrichment
            </h3>
            <p className="text-gray-600">
              Generate IAB categories, brand safety scores, and contextual
              segments formatted for Magnite, PubMatic, and AdsWizz integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
