"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface AdBreak {
  id: string;
  startTime: number;
  maxDuration: number;
}

interface Episode {
  id: number;
  title: string;
  transcript: string | null;
  adBreaks: AdBreak[] | null;
  publisher: {
    id: number;
    name: string;
  };
}

export default function EditEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const episodeIdStr = Array.isArray(params.episodeId) ? params.episodeId[0] : params.episodeId;
  const episodeId = parseInt(episodeIdStr || "0", 10);

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adBreaks, setAdBreaks] = useState<AdBreak[]>([]);
  const [episodeDuration, setEpisodeDuration] = useState<number>(3600); // Default 1 hour in seconds

  useEffect(() => {
    if (isNaN(episodeId)) {
      setError("Invalid episode ID");
      setLoading(false);
      return;
    }

    fetch(`/api/episodes/${episodeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEpisode(data);
          const breaks = (data.adBreaks as AdBreak[]) || [];
          setAdBreaks(breaks.length > 0 ? breaks : []);
        }
      })
      .catch((err) => {
        setError("Failed to load episode");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [episodeId]);

  const addAdBreak = () => {
    const newBreak: AdBreak = {
      id: `break-${Date.now()}`,
      startTime: 0,
      maxDuration: 30,
    };
    setAdBreaks([...adBreaks, newBreak]);
  };

  const removeAdBreak = (index: number) => {
    setAdBreaks(adBreaks.filter((_, i) => i !== index));
  };

  const updateAdBreak = (index: number, field: keyof AdBreak, value: string | number) => {
    const updated = [...adBreaks];
    updated[index] = { ...updated[index], [field]: value };
    setAdBreaks(updated);
  };

  const parseTimeInput = (input: string): number => {
    // Parse MM:SS format to seconds
    const parts = input.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(input, 10) || 0;
  };

  const formatTimeOutput = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const applyDefaultTemplate = (template: "pre-only" | "pre-mid" | "pre-post") => {
    let newBreaks: AdBreak[] = [];

    switch (template) {
      case "pre-only":
        newBreaks = [
          {
            id: "pre-roll",
            startTime: 0,
            maxDuration: 30,
          },
        ];
        break;

      case "pre-mid":
        const midpoint = Math.floor(episodeDuration / 2);
        newBreaks = [
          {
            id: "pre-roll",
            startTime: 0,
            maxDuration: 30,
          },
          {
            id: "mid-roll-1",
            startTime: midpoint,
            maxDuration: 60,
          },
        ];
        break;

      case "pre-post":
        const endTime = Math.max(0, episodeDuration - 30);
        newBreaks = [
          {
            id: "pre-roll",
            startTime: 0,
            maxDuration: 30,
          },
          {
            id: "post-roll",
            startTime: endTime,
            maxDuration: 30,
          },
        ];
        break;
    }

    setAdBreaks(newBreaks);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adBreaks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save ad breaks");
      }

      const updatedEpisode = await response.json();
      setEpisode(updatedEpisode);
      alert("Ad breaks saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ad breaks");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <p className="text-gray-500">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error && !episode) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Ad Breaks
              </h1>
              <p className="text-gray-600">
                {episode?.title || "Untitled Episode"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Publisher: {episode?.publisher.name}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
            >
              Back to Library
            </button>
          </div>
        </div>

        {/* Episode Duration Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Episode Duration (seconds)
          </label>
          <input
            type="number"
            value={episodeDuration}
            onChange={(e) => setEpisodeDuration(parseInt(e.target.value, 10) || 0)}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="3600"
          />
          <p className="text-sm text-gray-500 mt-1">
            Used for calculating midpoint and post-roll positions in templates
          </p>
        </div>

        {/* Default Templates */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Default Templates
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Apply a pre-configured ad break template:
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => applyDefaultTemplate("pre-only")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
            >
              Pre-roll Only
            </button>
            <button
              onClick={() => applyDefaultTemplate("pre-mid")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
            >
              Pre-roll + Mid-roll
            </button>
            <button
              onClick={() => applyDefaultTemplate("pre-post")}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
            >
              Pre-roll + Post-roll
            </button>
          </div>
        </div>

        {/* Ad Breaks List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ad Breaks</h2>
            <button
              onClick={addAdBreak}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              Add Ad Break
            </button>
          </div>

          {adBreaks.length === 0 ? (
            <p className="text-gray-500 text-sm">No ad breaks defined. Click "Add Ad Break" to create one.</p>
          ) : (
            <div className="space-y-4">
              {adBreaks.map((adBreak, index) => (
                <div
                  key={adBreak.id || index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Break Type
                      </label>
                      <select
                        value={adBreak.id}
                        onChange={(e) => updateAdBreak(index, "id", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="pre-roll">Pre-roll</option>
                        <option value="mid-roll-1">Mid-roll 1</option>
                        <option value="mid-roll-2">Mid-roll 2</option>
                        <option value="post-roll">Post-roll</option>
                        <option value={`break-${index}`}>Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time (MM:SS or seconds)
                      </label>
                      <input
                        type="text"
                        value={formatTimeOutput(adBreak.startTime)}
                        onChange={(e) => {
                          const seconds = parseTimeInput(e.target.value);
                          updateAdBreak(index, "startTime", seconds);
                        }}
                        placeholder="00:00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {adBreak.startTime} seconds
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={adBreak.maxDuration}
                        onChange={(e) =>
                          updateAdBreak(
                            index,
                            "maxDuration",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeAdBreak(index)}
                    className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Ad Breaks"}
          </button>
        </div>
      </div>
    </div>
  );
}

