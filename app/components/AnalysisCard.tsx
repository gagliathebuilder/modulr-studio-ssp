interface AnalysisCardProps {
  summary?: string;
  topics?: string[];
  tone?: string;
  sentiment?: string;
  brandSafetyScore?: number;
  iabCategories?: string[];
  contextualSegments?: string[];
}

export default function AnalysisCard({
  summary,
  topics = [],
  tone,
  sentiment,
  brandSafetyScore,
  iabCategories = [],
  contextualSegments = [],
}: AnalysisCardProps) {
  const getBrandSafetyColor = (score?: number) => {
    if (!score) return "bg-gray-200";
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {summary && (
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tone && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tone</h3>
            <p className="text-xl font-semibold text-gray-900 capitalize">
              {tone}
            </p>
          </div>
        )}

        {sentiment && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Sentiment
            </h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${getSentimentColor(
                sentiment
              )}`}
            >
              {sentiment}
            </span>
          </div>
        )}

        {brandSafetyScore !== undefined && (
          <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Brand Safety Score
            </h3>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getBrandSafetyColor(
                    brandSafetyScore
                  )}`}
                  style={{ width: `${(brandSafetyScore / 10) * 100}%` }}
                ></div>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {brandSafetyScore}/10
              </span>
            </div>
          </div>
        )}
      </div>

      {topics.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {iabCategories.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            IAB Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {iabCategories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {contextualSegments.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Contextual Segments
          </h3>
          <div className="flex flex-wrap gap-2">
            {contextualSegments.map((segment, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
              >
                {segment}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
