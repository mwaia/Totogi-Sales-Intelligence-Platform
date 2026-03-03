import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accounts as api } from "../api";
import { STATUS_OPTIONS, STATUS_LABELS } from "../types";
import type { Contact } from "../types";

export default function AccountNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    country: "",
    website: "",
    employee_count: "",
    annual_revenue: "",
    current_status: "prospect",
    notes: "",
  });

  const [contacts, setContacts] = useState<Contact[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      { name: "", title: "", email: "", phone: "", is_champion: false, notes: "" },
    ]);
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    const updated = [...contacts];
    (updated[index] as Record<string, string | boolean>)[field] = value;
    setContacts(updated);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const account = await api.create({ ...form, key_contacts: contacts });
      navigate(`/accounts/${account.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto" style={{ backgroundColor: '#f7f5f9' }}>
      <h1 className="text-2xl font-bold text-[#001C3D] mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Add Account</h1>

      {error && (
        <div className="text-sm text-[#FF4F59] bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-4 animate-fade-in">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Company Info</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="e.g. Telecommunications"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="current_status"
                value={form.current_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
              <input
                name="employee_count"
                value={form.employee_count}
                onChange={handleChange}
                placeholder="e.g. 10,000-50,000"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
              <input
                name="annual_revenue"
                value={form.annual_revenue}
                onChange={handleChange}
                placeholder="e.g. $1B-$5B"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] outline-none"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#001C3D]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Key Contacts</h2>
            <button
              type="button"
              onClick={addContact}
              className="text-sm text-[#802DC8] hover:text-[#6b22a8] font-medium"
            >
              + Add Contact
            </button>
          </div>

          {contacts.map((contact, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Contact {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={contact.name}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                  placeholder="Name"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  value={contact.title}
                  onChange={(e) => updateContact(i, "title", e.target.value)}
                  placeholder="Title"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  value={contact.email}
                  onChange={(e) => updateContact(i, "email", e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  value={contact.phone}
                  onChange={(e) => updateContact(i, "phone", e.target.value)}
                  placeholder="Phone"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={contact.is_champion}
                  onChange={(e) => updateContact(i, "is_champion", e.target.checked)}
                  className="rounded"
                />
                Internal Champion
              </label>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#802DC8] text-white rounded-xl font-semibold hover:bg-[#6b22a8] disabled:opacity-50 shadow-sm transition-colors"
          >
            {saving ? "Creating..." : "Create Account"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/accounts")}
            className="px-6 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
