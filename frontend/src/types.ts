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

export interface AccountDocument {
  id: number;
  account_id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  has_extracted_text: boolean;
  doc_type: "knowledge" | "activity";
  uploaded_by_id: number | null;
  created_at: string;
}

export interface IntelligenceBrief {
  id: number;
  account_id: number;
  summary: string;
  key_highlights: { text: string; category: string; signal_type: string }[];
  risk_signals: { text: string; severity: string }[];
  opportunity_signals: { text: string; priority: string }[];
  generated_at: string;
}

export const INTELLIGENCE_CATEGORIES: Record<string, { label: string; color: string }> = {
  news: { label: "News", color: "bg-blue-100 text-blue-700" },
  press_release: { label: "Press Release", color: "bg-purple-100 text-purple-700" },
  social: { label: "Social", color: "bg-pink-100 text-pink-700" },
  financial_update: { label: "Financial", color: "bg-green-100 text-green-700" },
  executive_change: { label: "Executive", color: "bg-yellow-100 text-yellow-700" },
  competitor_activity: { label: "Competitor", color: "bg-red-100 text-red-700" },
  industry_trend: { label: "Industry", color: "bg-indigo-100 text-indigo-700" },
  technology_initiative: { label: "Technology", color: "bg-teal-100 text-teal-700" },
};

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
  | "beachhead"
  | "executive_summary"
  | "roi_business_case"
  | "battle_card"
  | "talk_track"
  | "email_sequences"
  | "win_loss_analysis"
  | "qbr_brief"
  | "expansion_plan"
  | "next_steps";

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  full: "Full Account Plan",
  use_cases: "Use Cases",
  messaging: "Custom Messaging",
  stakeholder_map: "Stakeholder Map",
  deal_strategy: "Deal Strategy",
  beachhead: "Beachhead Identification",
  executive_summary: "Executive Summary",
  roi_business_case: "ROI Business Case",
  battle_card: "Competitive Battle Card",
  talk_track: "Talk Track & Discovery",
  email_sequences: "Email Sequences",
  win_loss_analysis: "Win/Loss Analysis",
  qbr_brief: "QBR Prep Brief",
  expansion_plan: "Account Expansion Plan",
  next_steps: "Next Steps",
};

export interface ArtifactCategory {
  label: string;
  types: PlanType[];
}

export const ARTIFACT_CATEGORIES: ArtifactCategory[] = [
  {
    label: "Strategy",
    types: ["full", "use_cases", "stakeholder_map", "deal_strategy", "beachhead", "expansion_plan"],
  },
  {
    label: "Sales Materials",
    types: ["executive_summary", "messaging", "roi_business_case", "battle_card", "talk_track", "email_sequences", "next_steps"],
  },
  {
    label: "Review & Analysis",
    types: ["win_loss_analysis", "qbr_brief"],
  },
];

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
