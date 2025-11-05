"use client";

import { useState, useEffect } from "react";
import { formatGAMKVsForManualEntry } from "@/app/lib/gam";

export default function GAMSetupPage() {
  const [episodeId, setEpisodeId] = useState<string>("");
  const [kvPreview, setKvPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handlePreviewKVs = async () => {
    if (!episodeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/episodes/${episodeId}/export/gam`);
      if (response.ok) {
        const kvs = await response.json();
        const formatted = Object.entries(kvs)
          .map(([key, value]) => `${key} = ${value}`)
          .join("\n");
        setKvPreview(formatted);
      } else {
        setKvPreview("Error: Episode not found or invalid ID");
      }
    } catch (error) {
      setKvPreview("Error loading episode metadata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GAM Integration Setup
          </h1>
          <p className="text-gray-600">
            Configure Google Ad Manager to use Modulr contextual metadata
          </p>
        </div>

        {/* Step 1: Custom Targeting Keys */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 1: Create Custom Targeting Keys
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Log in to your Google Ad Manager account</li>
            <li>Navigate to <strong>Admin → Targeting → Custom targeting</strong></li>
            <li>Click <strong>"New custom targeting key"</strong></li>
            <li>Create the following keys with these settings:</li>
          </ol>

          <div className="mt-4 bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <table className="min-w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">Key Name</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_iab_cat</td>
                  <td className="py-2 px-3 text-gray-900">Predefined</td>
                  <td className="py-2 px-3 text-gray-900">IAB Content Categories (comma-separated)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_sentiment</td>
                  <td className="py-2 px-3 text-gray-900">Predefined</td>
                  <td className="py-2 px-3 text-gray-900">Content sentiment (positive/neutral/negative)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_brand_safety</td>
                  <td className="py-2 px-3 text-gray-900">Free-form</td>
                  <td className="py-2 px-3 text-gray-900">Brand safety score (0-10)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_segments</td>
                  <td className="py-2 px-3 text-gray-900">Predefined</td>
                  <td className="py-2 px-3 text-gray-900">Contextual audience segments</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_topics</td>
                  <td className="py-2 px-3 text-gray-900">Free-form</td>
                  <td className="py-2 px-3 text-gray-900">Content topics (comma-separated)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono text-gray-900">modulr_entities</td>
                  <td className="py-2 px-3 text-gray-900">Free-form</td>
                  <td className="py-2 px-3 text-gray-900">Named entities mentioned (comma-separated)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-900">
              <strong className="text-gray-900">Note:</strong> For predefined keys, you'll need to create values for each
              possible option (e.g., for modulr_sentiment, create values: "positive", "neutral",
              "negative").
            </p>
          </div>
        </div>

        {/* Step 2: Ad Break Keys */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 2: Create Ad Break Targeting Keys (Optional)
          </h2>
          <p className="text-gray-700 mb-4">
            If you're using ad break metadata, create these additional keys:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-900">
{`ad_0_start, ad_0_maxdur, ad_0_id
ad_1_start, ad_1_maxdur, ad_1_id
... (one set per ad break)`}
            </pre>
          </div>
        </div>

        {/* Step 3: Key-Value Pairs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 3: Preview Key-Value Pairs
          </h2>
          <p className="text-gray-700 mb-4">
            Enter an episode ID to preview the key-value pairs that will be sent to GAM:
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={episodeId}
              onChange={(e) => setEpisodeId(e.target.value)}
              placeholder="Episode ID"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
            <button
              onClick={handlePreviewKVs}
              disabled={!episodeId || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Preview KVs"}
            </button>
          </div>
          {kvPreview && (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap text-gray-900">{kvPreview}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(kvPreview);
                }}
                className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>

        {/* Step 4: Line Item Targeting */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 4: Configure Line Item Targeting
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Navigate to <strong>Delivery → Line items</strong></li>
            <li>Open or create a line item</li>
            <li>Go to the <strong>"Targeting"</strong> tab</li>
            <li>Add custom targeting criteria:</li>
          </ol>
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              Example targeting rules:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Target high brand safety: <code className="bg-white px-1 rounded">modulr_brand_safety &gt;= 8</code></li>
              <li>Target positive sentiment: <code className="bg-white px-1 rounded">modulr_sentiment = positive</code></li>
              <li>Target specific IAB category: <code className="bg-white px-1 rounded">modulr_iab_cat contains IAB19</code></li>
              <li>Target tech segments: <code className="bg-white px-1 rounded">modulr_segments contains tech-savvy</code></li>
            </ul>
          </div>
        </div>

        {/* Step 5: Implementation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Step 5: Implement Key-Value Passing
          </h2>
          <p className="text-gray-700 mb-4">
            In your ad serving code, pass the key-value pairs when making ad requests. Here's an
            example using Google Publisher Tag (GPT):
          </p>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-100" style={{ color: 'rgb(243, 244, 246)' }}>
{`// Example: Passing Modulr KVs via GPT
googletag.pubads().setTargeting('modulr_iab_cat', ['IAB19', 'IAB20']);
googletag.pubads().setTargeting('modulr_sentiment', 'positive');
googletag.pubads().setTargeting('modulr_brand_safety', '8.5');
googletag.pubads().setTargeting('modulr_segments', ['tech-savvy professionals']);

// For ad breaks
googletag.pubads().setTargeting('ad_0_start', '0');
googletag.pubads().setTargeting('ad_0_maxdur', '30');`}
            </pre>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-900">
              <strong className="text-gray-900">Important:</strong> Ensure your ad serving implementation dynamically
              retrieves episode metadata and passes it as targeting KVs on each ad request.
            </p>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Additional Resources
          </h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <a
                href="https://support.google.com/admanager/answer/177381"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GAM Custom Targeting Documentation
              </a>
            </li>
            <li>
              <a
                href="https://developers.google.com/publisher-tag/guides/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Publisher Tag Guide
              </a>
            </li>
            <li>
              <a
                href="/api/episodes/export/gam"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                GAM KV Export API Documentation
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

