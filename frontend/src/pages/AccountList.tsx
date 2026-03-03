import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accounts as api } from "../api";
import type { Account } from "../types";
import { STATUS_LABELS, STATUS_COLORS } from "../types";

export default function AccountList() {
  const [accountsList, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.list(search);
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccounts();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
        <Link
          to="/accounts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Account
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </form>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : accountsList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No accounts yet</p>
          <p className="text-sm mt-1">Add your first sales account to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {accountsList.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{account.company_name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {STATUS_LABELS[account.current_status] || account.current_status}
                </span>
              </div>
              {account.industry && (
                <p className="text-sm text-gray-500 mt-1">{account.industry}</p>
              )}
              {account.country && (
                <p className="text-sm text-gray-400 mt-0.5">{account.country}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                {account.key_contacts.length > 0 && (
                  <span>{account.key_contacts.length} contacts</span>
                )}
                <span>{new Date(account.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
