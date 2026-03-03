import { useState } from "react";
import { auth } from "../api";

export default function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    try {
      await auth.seed();
      setUsername("admin");
      setPassword("admin123");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed — users may already exist");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f5f9" }}>
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden bg-white">
          {/* Branded header */}
          <div
            className="px-8 py-8 text-center"
            style={{ background: "linear-gradient(135deg, #001C3D 0%, #802DC8 100%)" }}
          >
            <h1
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Totogi Sales Intelligence
            </h1>
            <p className="text-sm text-purple-200 mt-1 opacity-80">AI-Powered Account Strategy</p>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Username field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#802DC8] focus:border-[#802DC8] outline-none transition-shadow"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#802DC8] focus:border-[#802DC8] outline-none transition-shadow"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#802DC8] text-white rounded-lg font-semibold hover:bg-[#6b22a8] disabled:opacity-50 transition-colors shadow-md shadow-purple-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Demo account link */}
        <div className="text-center mt-6">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-sm text-[#802DC8]/60 hover:text-[#802DC8] transition-colors"
          >
            {seeding ? "Creating..." : "First time? Create demo account"}
          </button>
        </div>
      </div>
    </div>
  );
}
