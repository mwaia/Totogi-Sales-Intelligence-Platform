import { useState, useEffect } from "react";
import { tasks as tasksApi, dealsApi } from "../api";
import type { AccountTask, Deal } from "../types";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const NEXT_STATUS: Record<string, string> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

export default function TaskSection({ accountId }: { accountId: number }) {
  const [taskList, setTaskList] = useState<AccountTask[]>([]);
  const [dealsList, setDealsList] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [filter, setFilter] = useState("");

  // Task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [selectedDealId, setSelectedDealId] = useState<number>(0);

  // Deal form state
  const [dealTitle, setDealTitle] = useState("");
  const [dealStatus, setDealStatus] = useState("prospect");
  const [dealValue, setDealValue] = useState("");

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, dealsData] = await Promise.all([
        tasksApi.list(accountId),
        dealsApi.list(accountId),
      ]);
      setTaskList(tasksData);
      setDealsList(dealsData);
      if (dealsData.length > 0 && !selectedDealId) {
        setSelectedDealId(dealsData[0].id);
      }
    } catch {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedDealId) return;
    try {
      const task = await tasksApi.create(accountId, {
        deal_id: selectedDealId,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || undefined,
        priority,
      });
      setTaskList((prev) => [task, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleCreateDeal = async () => {
    if (!dealTitle.trim()) return;
    try {
      const deal = await dealsApi.create(accountId, {
        title: dealTitle.trim(),
        current_status: dealStatus,
        deal_value: Number(dealValue) || 0,
      });
      setDealsList((prev) => [deal, ...prev]);
      setSelectedDealId(deal.id);
      setDealTitle("");
      setDealStatus("prospect");
      setDealValue("");
      setShowDealForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
    }
  };

  const handleStatusToggle = async (task: AccountTask) => {
    const newStatus = NEXT_STATUS[task.status] || "todo";
    try {
      const updated = await tasksApi.update(task.id, { status: newStatus } as Partial<AccountTask>);
      setTaskList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError("Failed to update task");
    }
  };

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id);
    setTaskList((prev) => prev.filter((t) => t.id !== id));
  };

  const isOverdue = (task: AccountTask) => {
    if (!task.due_date || task.status === "done") return false;
    return new Date(task.due_date) < new Date();
  };

  const filteredTasks = filter
    ? taskList.filter((t) => t.status === filter)
    : taskList;

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 justify-center">
        <svg className="animate-spin h-5 w-5 text-[#802DC8]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-[#FF4F59] text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#001C3D]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Deals & Tasks
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDealForm(!showDealForm); setShowForm(false); }}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#802DC8] text-[#802DC8] rounded-xl text-sm font-medium hover:bg-[#802DC8]/5 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Deal
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowDealForm(false); }}
            disabled={dealsList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-medium hover:bg-[#6b24a8] disabled:opacity-60 transition-all shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* New Deal Form */}
      {showDealForm && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-fade-in border-l-4 border-l-[#802DC8]">
          <h4 className="font-semibold text-[#001C3D] text-sm">New Deal</h4>
          <input
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            placeholder="Deal name (e.g. StarHub 5G Charging Platform)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            autoFocus
          />
          <div className="flex gap-3">
            <select
              value={dealStatus}
              onChange={(e) => setDealStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            >
              <option value="prospect">Prospect</option>
              <option value="qualified">Qualified</option>
              <option value="discovery">Discovery</option>
              <option value="poc">POC</option>
              <option value="negotiation">Negotiation</option>
            </select>
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
              placeholder="Deal value ($)"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateDeal} disabled={!dealTitle.trim()} className="px-5 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] disabled:opacity-60 transition-colors">
              Create Deal
            </button>
            <button onClick={() => setShowDealForm(false)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New Task Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-fade-in">
          {/* Deal selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deal</label>
            <select
              value={selectedDealId}
              onChange={(e) => setSelectedDealId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
            >
              <option value={0} disabled>Select a deal...</option>
              {dealsList.map((d) => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all resize-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#802DC8]/30 focus:border-[#802DC8] transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !selectedDealId}
              className="px-5 py-2 bg-[#802DC8] text-white rounded-xl text-sm font-semibold hover:bg-[#6b24a8] disabled:opacity-60 transition-colors"
            >
              Create Task
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

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white rounded-full p-1 shadow-sm inline-flex">
        {[
          { key: "", label: "All" },
          { key: "todo", label: "To Do" },
          { key: "in_progress", label: "In Progress" },
          { key: "done", label: "Done" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-[#802DC8] text-white"
                : "text-gray-500 hover:bg-[#ECE1F0]"
            }`}
          >
            {f.label}
            {f.key === "" && ` (${taskList.length})`}
            {f.key && ` (${taskList.filter((t) => t.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl shadow-sm p-4 flex items-start gap-3 group hover:shadow-md transition-all ${
                isOverdue(task) ? "border-l-4 border-l-[#FF4F59]" : ""
              }`}
            >
              {/* Status checkbox */}
              <button
                onClick={() => handleStatusToggle(task)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  task.status === "done"
                    ? "bg-green-500 border-green-500 text-white"
                    : task.status === "in_progress"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-[#802DC8]"
                }`}
                title={`Click to set: ${STATUS_LABELS[NEXT_STATUS[task.status]]}`}
              >
                {task.status === "done" && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {task.status === "in_progress" && (
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium text-sm ${
                    task.status === "done" ? "text-gray-400 line-through" : "text-[#001C3D]"
                  }`}>
                    {task.title}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.deal_title && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#ECE1F0] text-[#802DC8]">
                      {task.deal_title}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {task.due_date && (
                    <span className={isOverdue(task) ? "text-[#FF4F59] font-medium" : ""}>
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {task.assigned_to_name && (
                    <span>Assigned: {task.assigned_to_name}</span>
                  )}
                  {task.created_by_name && (
                    <span>By: {task.created_by_name}</span>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 animate-fade-in">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[#ECE1F0] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#802DC8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[#001C3D] text-sm font-medium mb-1">
            {filter ? "No tasks in this category" : "No tasks yet"}
          </p>
          <p className="text-gray-400 text-xs">
            Click <span className="font-medium text-[#802DC8]">Add Task</span> to create your first task.
          </p>
        </div>
      )}
    </div>
  );
}
