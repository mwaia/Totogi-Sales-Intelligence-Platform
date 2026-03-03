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
    <div className="min-h-screen bg-[#f7f5f9]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Accounts
          </h1>
          <Link
            to="/accounts/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Account
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-lg">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm text-[#001C3D] placeholder-gray-400 focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none transition-all"
            />
          </div>
        </form>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">Loading accounts...</span>
            </div>
          </div>
        ) : accountsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#ECE1F0] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#001C3D] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              No accounts yet
            </p>
            <p className="text-sm text-gray-400 mb-5">Add your first sales account to get started</p>
            <Link
              to="/accounts/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Account
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {accountsList.map((account) => (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 p-5 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#802DC8] text-white font-semibold flex items-center justify-center text-sm shrink-0">
                      {account.company_name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-[#001C3D] text-base group-hover:text-[#802DC8] transition-colors leading-tight">
                      {account.company_name}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                      STATUS_COLORS[account.current_status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[account.current_status] || account.current_status}
                  </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3 pt-3 border-t border-gray-100">
                  {account.industry && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-gray-600 truncate">{account.industry}</span>
                    </div>
                  )}
                  {account.country && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600 truncate">{account.country}</span>
                    </div>
                  )}
                  {account.key_contacts.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-gray-600">{account.key_contacts.length} contact{account.key_contacts.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-400 text-xs">{new Date(account.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
