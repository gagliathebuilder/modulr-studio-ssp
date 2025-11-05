interface MetadataTableProps {
  data: {
    topics?: string[];
    entities?: string[];
    tone?: string;
    sentiment?: string;
    brandSafetyScore?: number;
    iabCategories?: string[];
    contextualSegments?: string[];
  };
}

export default function MetadataTable({ data }: MetadataTableProps) {
  const rows = [
    {
      label: "Topics",
      value: data.topics?.join(", ") || "N/A",
    },
    {
      label: "Entities",
      value: data.entities?.join(", ") || "N/A",
    },
    {
      label: "Tone",
      value: data.tone || "N/A",
    },
    {
      label: "Sentiment",
      value: data.sentiment || "N/A",
    },
    {
      label: "Brand Safety Score",
      value: data.brandSafetyScore !== undefined ? `${data.brandSafetyScore}/10` : "N/A",
    },
    {
      label: "IAB Categories",
      value: data.iabCategories?.join(", ") || "N/A",
    },
    {
      label: "Contextual Segments",
      value: data.contextualSegments?.join(", ") || "N/A",
    },
  ];

  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Enriched Metadata (SSP-Ready)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 w-1/4">
                  {row.label}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
