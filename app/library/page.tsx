"use client";

import { useState, useEffect } from "react";

interface Publisher {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
}

interface Episode {
  id: number;
  title: string;
  rssUrl: string | null;
  transcript: string | null;
  enrichedMetadata: any;
  brandSafetyScore: number | null;
  sentiment: string | null;
  contextualScore: number | null;
  createdAt: string;
  publisher: {
    id: number;
    name: string;
    email: string | null;
    company: string | null;
  };
}

interface EpisodesResponse {
  episodes: Episode[];
  count: number;
  totalCount: number;
  error?: string;
}

export default function LibraryPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [iabCategories, setIabCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [selectedPublisher, setSelectedPublisher] = useState<string>("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("");
  const [selectedIabCategory, setSelectedIabCategory] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Bulk selection
  const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Fetch publishers and IAB categories
  useEffect(() => {
    fetch("/api/publishers")
      .then((res) => res.json())
      .then((data) => {
        if (data.publishers) {
          setPublishers(data.publishers);
        }
      })
      .catch((err) => console.error("Failed to fetch publishers:", err));

    // Fetch all episodes to extract unique IAB categories
    fetch("/api/episodes?limit=1000")
      .then((res) => res.json())
      .then((data) => {
        if (data.episodes) {
          const categories = Array.from(
            new Set(
              data.episodes.flatMap((episode: Episode) => {
                const metadata = episode.enrichedMetadata as any;
                return metadata?.iab_categories || [];
              })
            )
          ).sort() as string[];
          setIabCategories(categories);
        }
      })
      .catch((err) => console.error("Failed to fetch IAB categories:", err));
  }, []);

  // Fetch episodes
  useEffect(() => {
    fetchEpisodes();
  }, [
    currentPage,
    selectedPublisher,
    selectedSentiment,
    selectedIabCategory,
    dateFrom,
    dateTo,
    searchQuery,
  ]);

  const fetchEpisodes = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("limit", pageSize.toString());
      params.append("skip", ((currentPage - 1) * pageSize).toString());

      if (selectedPublisher) {
        params.append("publisherId", selectedPublisher);
      }
      if (selectedSentiment) {
        params.append("sentiment", selectedSentiment);
      }
      if (selectedIabCategory) {
        params.append("iabCategory", selectedIabCategory);
      }
      if (dateFrom) {
        params.append("dateFrom", dateFrom);
      }
      if (dateTo) {
        params.append("dateTo", dateTo);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/episodes?${params.toString()}`);
      const data: EpisodesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch episodes");
      }

      setEpisodes(data.episodes || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch episodes");
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(episodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `episodes-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      "Title",
      "Publisher",
      "IAB Categories",
      "Sentiment",
      "Brand Safety Score",
      "Created Date",
    ];

    const rows = episodes.map((episode) => {
      const metadata = episode.enrichedMetadata as any;
      const iabCategories = metadata?.iab_categories || [];
      return [
        episode.title || "",
        episode.publisher?.name || "",
        iabCategories.join("; "),
        episode.sentiment || "",
        episode.brandSafetyScore?.toString() || "",
        new Date(episode.createdAt).toLocaleDateString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const dataBlob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `episodes-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPrebid = async (episodeId: number) => {
    try {
      const response = await fetch(`/api/episodes/${episodeId}/export/prebid`);
      if (response.ok) {
        const data = await response.json();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `episode-${episodeId}-prebid-ext.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export Prebid ext:", error);
      alert("Failed to export Prebid extension");
    }
  };

  const handleExportGAM = async (episodeId: number) => {
    try {
      const response = await fetch(`/api/episodes/${episodeId}/export/gam`);
      if (response.ok) {
        const data = await response.json();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `episode-${episodeId}-gam-kvs.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export GAM KVs:", error);
      alert("Failed to export GAM key-values");
    }
  };

  const handleBulkExport = async (format: "json" | "csv" | "prebid" | "gam") => {
    if (selectedEpisodes.size === 0) {
      alert("Please select at least one episode");
      return;
    }

    setExporting(true);
    try {
      const response = await fetch("/api/episodes/export/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          episodeIds: Array.from(selectedEpisodes),
          format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = response.headers.get("Content-Disposition")?.split("filename=")[1] || `bulk-export-${Date.now()}.${format === "csv" ? "csv" : "json"}`;
        link.download = filename.replace(/"/g, "");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Bulk export error:", error);
      alert("Failed to export episodes");
    } finally {
      setExporting(false);
    }
  };

  const toggleEpisodeSelection = (episodeId: number) => {
    const newSelection = new Set(selectedEpisodes);
    if (newSelection.has(episodeId)) {
      newSelection.delete(episodeId);
    } else {
      newSelection.add(episodeId);
    }
    setSelectedEpisodes(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEpisodes.size === episodes.length) {
      setSelectedEpisodes(new Set());
    } else {
      setSelectedEpisodes(new Set(episodes.map((e) => e.id)));
    }
  };

  const clearFilters = () => {
    setSelectedPublisher("");
    setSelectedSentiment("");
    setSelectedIabCategory("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Content Library
              </h1>
              <p className="text-gray-600">
                View and manage your analyzed episodes
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExportJSON}
                disabled={episodes.length === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                disabled={episodes.length === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
              {selectedEpisodes.size > 0 && (
                <>
                  <button
                    onClick={() => handleBulkExport("prebid")}
                    disabled={exporting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? "Exporting..." : `Export Prebid (${selectedEpisodes.size})`}
                  </button>
                  <button
                    onClick={() => handleBulkExport("gam")}
                    disabled={exporting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? "Exporting..." : `Export GAM (${selectedEpisodes.size})`}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search episodes by title..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publisher
                </label>
                <select
                  value={selectedPublisher}
                  onChange={(e) => {
                    setSelectedPublisher(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Publishers</option>
                  {publishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sentiment
                </label>
                <select
                  value={selectedSentiment}
                  onChange={(e) => {
                    setSelectedSentiment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IAB Category
                </label>
                <select
                  value={selectedIabCategory}
                  onChange={(e) => {
                    setSelectedIabCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Categories</option>
                  {iabCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>

        {/* Episodes Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Loading episodes...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-red-600">Error: {error}</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">
              No episodes found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedEpisodes.size === episodes.length && episodes.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Publisher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IAB Categories
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sentiment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand Safety
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {episodes.map((episode) => {
                      const metadata = episode.enrichedMetadata as any;
                      const iabCategories = metadata?.iab_categories || [];
                      return (
                        <tr key={episode.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedEpisodes.has(episode.id)}
                              onChange={() => toggleEpisodeSelection(episode.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {episode.title || "Untitled Episode"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {episode.publisher?.name || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {iabCategories.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {iabCategories.map((cat: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                episode.sentiment === "positive"
                                  ? "bg-green-100 text-green-800"
                                  : episode.sentiment === "negative"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {episode.sentiment || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {episode.brandSafetyScore !== null
                                ? `${episode.brandSafetyScore}/10`
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(episode.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <a
                                href={`/library/${episode.id}/edit`}
                                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-medium"
                                title="Edit Ad Breaks"
                              >
                                Edit
                              </a>
                              <button
                                onClick={() => handleExportPrebid(episode.id)}
                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium"
                                title="Export Prebid Ext"
                              >
                                Prebid
                              </button>
                              <button
                                onClick={() => handleExportGAM(episode.id)}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium"
                                title="Export GAM KVs"
                              >
                                GAM
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
                  episodes
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
