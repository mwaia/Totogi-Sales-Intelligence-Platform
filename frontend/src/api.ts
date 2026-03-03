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
