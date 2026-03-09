const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export const auth = {
  login: (username: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ id: number; username: string; full_name: string; role: string }>("/auth/me"),
  seed: () => request<unknown>("/auth/seed", { method: "POST" }),
  listUsers: () => request<import("./types").User[]>("/auth/users"),
  createUser: (data: { username: string; password: string; full_name: string; role?: string }) =>
    request<import("./types").User>("/auth/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteUser: (userId: number) =>
    request<void>(`/auth/users/${userId}`, { method: "DELETE" }),
};

// Accounts
export const accounts = {
  list: (search = "", status = "") =>
    request<import("./types").Account[]>(
      `/accounts?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`
    ),
  get: (id: number) => request<import("./types").Account>(`/accounts/${id}`),
  create: (data: Partial<import("./types").Account>) =>
    request<import("./types").Account>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<import("./types").Account>) =>
    request<import("./types").Account>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/accounts/${id}`, { method: "DELETE" }),
};

// Deals
export const dealsApi = {
  list: (accountId: number) =>
    request<import("./types").Deal[]>(`/accounts/${accountId}/deals`),
  get: (dealId: number) =>
    request<import("./types").Deal>(`/deals/${dealId}`),
  create: (accountId: number, data: { title: string; description?: string; current_status?: string; deal_value?: number }) =>
    request<import("./types").Deal>(`/accounts/${accountId}/deals`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (dealId: number, data: Partial<import("./types").Deal>) =>
    request<import("./types").Deal>(`/deals/${dealId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (dealId: number) =>
    request<void>(`/deals/${dealId}`, { method: "DELETE" }),
};

// BrainLift
export const brainlift = {
  get: (accountId: number) =>
    request<import("./types").AccountBrainLift>(`/accounts/${accountId}/brainlift`),
  upload: async (accountId: number, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/accounts/${accountId}/brainlift`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Upload failed: ${res.status}`);
    }
    return res.json() as Promise<import("./types").AccountBrainLift>;
  },
  delete: (accountId: number) =>
    request<void>(`/accounts/${accountId}/brainlift`, { method: "DELETE" }),
  download: (accountId: number) => {
    const token = getToken();
    return fetch(`${API_BASE}/accounts/${accountId}/brainlift/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
};

// Tasks
export const tasks = {
  list: (accountId: number, status?: string) =>
    request<import("./types").AccountTask[]>(
      `/accounts/${accountId}/tasks${status ? `?status=${status}` : ""}`
    ),
  create: (accountId: number, data: {
    deal_id: number;
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
    assigned_to_id?: number;
  }) =>
    request<import("./types").AccountTask>(`/accounts/${accountId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (taskId: number, data: Partial<import("./types").AccountTask>) =>
    request<import("./types").AccountTask>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (taskId: number) =>
    request<void>(`/tasks/${taskId}`, { method: "DELETE" }),
};

// Notes
export const notesApi = {
  list: (accountId: number) =>
    request<import("./types").AccountNote[]>(`/accounts/${accountId}/notes`),
  create: (accountId: number, content: string) =>
    request<import("./types").AccountNote>(`/accounts/${accountId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  delete: (noteId: number) =>
    request<void>(`/notes/${noteId}`, { method: "DELETE" }),
};

// Dashboard
export const dashboard = {
  get: (accountId: number) =>
    request<import("./types").DashboardData>(`/accounts/${accountId}/dashboard`),
  pipelineSummary: () =>
    request<import("./types").PipelineSummary>("/accounts/pipeline-summary"),
};

// Plans
export const plans = {
  list: (accountId: number) =>
    request<import("./types").AccountPlan[]>(`/accounts/${accountId}/plans`),
  get: (planId: number) =>
    request<import("./types").AccountPlan>(`/plans/${planId}`),
  delete: (planId: number) =>
    request<void>(`/plans/${planId}`, { method: "DELETE" }),
  generate: (accountId: number, planType: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/accounts/${accountId}/plans/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ plan_type: planType }),
    });
  },
};

// News
export const news = {
  list: (accountId: number) =>
    request<import("./types").NewsItem[]>(`/accounts/${accountId}/news`),
  refresh: (accountId: number) =>
    request<{ message: string }>(`/accounts/${accountId}/news/refresh`, {
      method: "POST",
    }),
};

// Documents
export const documents = {
  list: (accountId: number) =>
    request<import("./types").AccountDocument[]>(`/accounts/${accountId}/documents`),
  upload: async (accountId: number, file: File, docType: "knowledge" | "activity" = "activity") => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/accounts/${accountId}/documents?doc_type=${docType}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Upload failed: ${res.status}`);
    }
    return res.json() as Promise<import("./types").AccountDocument>;
  },
  download: (docId: number) => {
    const token = getToken();
    return fetch(`${API_BASE}/documents/${docId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
  delete: (docId: number) =>
    request<void>(`/documents/${docId}`, { method: "DELETE" }),
};

// Intelligence
export const intelligence = {
  get: (accountId: number) =>
    request<{
      brief: import("./types").IntelligenceBrief | null;
      items: import("./types").NewsItem[];
    }>(`/accounts/${accountId}/intelligence`),
  refresh: (accountId: number) =>
    request<{ news_count: number; brief_id: number | null; message: string }>(
      `/accounts/${accountId}/intelligence/refresh`,
      { method: "POST" }
    ),
  listBriefs: (accountId: number) =>
    request<import("./types").IntelligenceBrief[]>(
      `/accounts/${accountId}/intelligence/briefs`
    ),
};

// Research
export const research = {
  list: (accountId: number) =>
    request<import("./types").ResearchReport[]>(`/accounts/${accountId}/research`),
  get: (reportId: number) =>
    request<import("./types").ResearchReport>(`/research/${reportId}`),
  create: (accountId: number, query: string, reportType: string = "deep_research") =>
    request<import("./types").ResearchReport>(`/accounts/${accountId}/research`, {
      method: "POST",
      body: JSON.stringify({ query, report_type: reportType }),
    }),
  stream: (accountId: number, query: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/accounts/${accountId}/research/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, report_type: "deep_research" }),
    });
  },
  webSearch: (accountId: number, query: string) =>
    request<{ text: string; citations: { title: string; url: string }[] }>(
      `/accounts/${accountId}/research/web-search`,
      {
        method: "POST",
        body: JSON.stringify({ query }),
      }
    ),
  delete: (reportId: number) =>
    request<void>(`/research/${reportId}`, { method: "DELETE" }),
};

// Embeddings
export const embeddings = {
  status: (accountId: number) =>
    request<import("./types").EmbeddingStatus[]>(`/accounts/${accountId}/embeddings/status`),
  embedAll: (accountId: number) =>
    request<{ documents_processed: number; documents_embedded: number; total_chunks: number }>(
      `/accounts/${accountId}/embeddings/embed-all`,
      { method: "POST" }
    ),
  embedDoc: (accountId: number, docId: number) =>
    request<{ document_id: number; chunks_created: number }>(
      `/accounts/${accountId}/documents/${docId}/embed`,
      { method: "POST" }
    ),
  search: (accountId: number, query: string, topK: number = 5) =>
    request<import("./types").SimilarityResult[]>(
      `/accounts/${accountId}/embeddings/search`,
      {
        method: "POST",
        body: JSON.stringify({ query, top_k: topK }),
      }
    ),
};

// Chat
export const chat = {
  listConversations: () =>
    request<import("./types").Conversation[]>("/chat/conversations"),
  createConversation: (accountId?: number, title?: string) =>
    request<import("./types").Conversation>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, title }),
    }),
  getConversation: (id: number) =>
    request<import("./types").Conversation & { messages: import("./types").ChatMessage[] }>(
      `/chat/conversations/${id}`
    ),
  sendMessage: (conversationId: number, content: string) => {
    const token = getToken();
    return fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
    });
  },
  deleteConversation: (id: number) =>
    request<void>(`/chat/conversations/${id}`, { method: "DELETE" }),
};
