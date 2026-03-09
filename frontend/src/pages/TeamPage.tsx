import { useState, useEffect } from "react";
import { auth } from "../api";
import type { User } from "../types";

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("rep");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, me] = await Promise.all([auth.listUsers(), auth.me()]);
      setUsers(usersData);
      setCurrentUser(me);
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!username.trim() || !password.trim() || !fullName.trim()) return;
    setError("");
    try {
      const user = await auth.createUser({
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        role,
      });
      setUsers((prev) => [...prev, user]);
      setUsername("");
      setPassword("");
      setFullName("");
      setRole("rep");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Delete this user? Their accounts will become unowned.")) return;
    try {
      await auth.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const isAdmin = currentUser?.role === "admin";

  if (loading) {
    return (
      <div className="p-8 bg-[#f7f5f9] min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#802DC8] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f7f5f9] min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Team
            </h1>
            <p className="text-sm text-gray-500 mt-1">{users.length} team members</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#802DC8] text-white rounded-lg text-sm font-semibold hover:bg-[#6b22a8] transition-colors shadow-md shadow-purple-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add User
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100 mb-4">
            {error}
          </div>
        )}

        {/* Create User Form */}
        {showForm && isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 space-y-4 animate-fade-in">
            <h3 className="font-semibold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              New Team Member
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jsmith"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Initial password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
                >
                  <option value="rep">Sales Rep</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!username.trim() || !password.trim() || !fullName.trim()}
                className="px-5 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] disabled:opacity-60 transition-colors"
              >
                Create User
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#802DC8] text-white font-semibold flex items-center justify-center text-sm">
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-[#001C3D] text-sm">{u.full_name}</span>
                    {u.id === currentUser?.id && (
                      <span className="text-[10px] bg-[#ECE1F0] text-[#802DC8] px-2 py-0.5 rounded-full font-medium ml-2">You</span>
                    )}
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    u.role === "admin" ? "bg-[#ECE1F0] text-[#802DC8]" : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role === "admin" ? "Admin" : "Sales Rep"}
                  </span>
                  {isAdmin && u.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isAdmin && (
          <p className="text-xs text-gray-400 text-center mt-4">Only admins can add or remove team members.</p>
        )}
      </div>
    </div>
  );
}
