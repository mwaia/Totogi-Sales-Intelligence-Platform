import { useState, useEffect } from "react";
import { news as newsApi } from "../api";
import type { NewsItem } from "../types";

export default function NewsSection({ accountId }: { accountId: number }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, [accountId]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await newsApi.list(accountId);
      setItems(data);
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    try {
      await newsApi.refresh(accountId);
      await loadNews();
    } catch (err) {
      console.error("Failed to refresh news:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const categoryColors: Record<string, string> = {
    press_release: "bg-blue-100 text-blue-700",
    news: "bg-green-100 text-green-700",
    social: "bg-purple-100 text-purple-700",
    industry_trend: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">News Intelligence</h2>
        <button
          onClick={refreshNews}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {refreshing ? "Searching..." : "Refresh News"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p>No news gathered yet</p>
          <p className="text-sm mt-1">Click "Refresh News" to search for recent articles and press releases</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[item.category] || "bg-gray-100 text-gray-700"}`}>
                      {item.category.replace("_", " ")}
                    </span>
                    {item.relevance_score > 0.7 && (
                      <span className="text-xs text-yellow-600 font-medium">High Relevance</span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                  {item.summary && (
                    <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{item.source}</span>
                    {item.published_at && (
                      <span>{new Date(item.published_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 ml-4 shrink-0"
                  >
                    Read
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
