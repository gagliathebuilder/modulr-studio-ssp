"use client";

import { useState } from "react";
import AnalysisCard from "@/app/components/AnalysisCard";
import MetadataTable from "@/app/components/MetadataTable";
import Loader from "@/app/components/Loader";

interface AnalysisResult {
  id: string;
  summary: string;
  topics: string[];
  entities: string[];
  tone: string;
  sentiment: string;
  brand_safety_score: number;
  iab_categories: string[];
  contextual_segments: string[];
  analyzedAt: string;
}

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim() || undefined,
          transcript: transcript.trim() || undefined,
          title: title.trim() || undefined,
        }),
      });

      if (!response.ok) {
<<<<<<< HEAD
        // Try to parse error, but handle HTML error pages
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          // If response is HTML (error page), extract error message
          if (text.includes("OPENAI_API_KEY")) {
            throw new Error("OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.");
          }
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || errorData.message || "Failed to analyze episode");
=======
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze episode");
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyze Episode
          </h1>
          <p className="text-gray-600">
            Input a podcast RSS URL or transcript to generate contextual metadata
            for SSP enrichment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Episode Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
<<<<<<< HEAD
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
=======
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
                placeholder="Enter episode title"
              />
            </div>

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                RSS URL or Episode URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
<<<<<<< HEAD
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
=======
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
                placeholder="https://example.com/podcast/rss.xml"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="transcript"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Transcript Text
              </label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
<<<<<<< HEAD
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
=======
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
                placeholder="Paste episode transcript here..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || (!url.trim() && !transcript.trim())}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analyzing..." : "Analyze Episode"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {loading && <Loader />}

        {result && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                Analysis completed successfully!
              </p>
              <p className="text-green-600 text-sm mt-1">
                Analyzed at: {new Date(result.analyzedAt).toLocaleString()}
              </p>
            </div>

            <AnalysisCard
              summary={result.summary}
              topics={result.topics}
              tone={result.tone}
              sentiment={result.sentiment}
              brandSafetyScore={result.brand_safety_score}
              iabCategories={result.iab_categories}
              contextualSegments={result.contextual_segments}
            />

            <MetadataTable
              data={{
                topics: result.topics,
                entities: result.entities,
                tone: result.tone,
                sentiment: result.sentiment,
                brandSafetyScore: result.brand_safety_score,
                iabCategories: result.iab_categories,
                contextualSegments: result.contextual_segments,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
