export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface Contact {
  name: string;
  title: string;
  email: string;
  phone: string;
  is_champion: boolean;
  notes: string;
}

export interface Account {
  id: number;
  company_name: string;
  industry: string;
  country: string;
  website: string;
  employee_count: string;
  annual_revenue: string;
  current_status: string;
  notes: string;
  key_contacts: Contact[];
  owner_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountPlan {
  id: number;
  account_id: number;
  plan_type: string;
  title: string;
  content: string;
  model_used: string;
  created_at: string;
}

export interface NewsItem {
  id: number;
  account_id: number | null;
  title: string;
  source: string;
  url: string;
  summary: string;
  published_at: string | null;
  scraped_at: string;
  relevance_score: number;
  category: string;
}

export interface Conversation {
  id: number;
  account_id: number | null;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  tool_calls: unknown[] | null;
  created_at: string;
}

export type PlanType =
  | "full"
  | "use_cases"
  | "messaging"
  | "stakeholder_map"
  | "deal_strategy"
  | "beachhead";

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  full: "Full Account Plan",
  use_cases: "Use Cases",
  messaging: "Custom Messaging",
  stakeholder_map: "Stakeholder Map",
  deal_strategy: "Deal Strategy",
  beachhead: "Beachhead Identification",
};

export const STATUS_OPTIONS = [
  "prospect",
  "qualified",
  "discovery",
  "poc",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  discovery: "Discovery",
  poc: "POC",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const STATUS_COLORS: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-700",
  qualified: "bg-blue-100 text-blue-700",
  discovery: "bg-purple-100 text-purple-700",
  poc: "bg-yellow-100 text-yellow-700",
  negotiation: "bg-orange-100 text-orange-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
};
