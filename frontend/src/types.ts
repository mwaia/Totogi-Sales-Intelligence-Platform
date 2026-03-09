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
  deal_value: number;
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

export interface Deal {
  id: number;
  account_id: number;
  title: string;
  description: string;
  current_status: string;
  deal_value: number;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  task_count: number;
  open_task_count: number;
}

export interface AccountBrainLift {
  id: number;
  account_id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  has_extracted_text: boolean;
  text_preview: string;
  uploaded_by_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountTask {
  id: number;
  deal_id: number;
  account_id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  deal_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountNote {
  id: number;
  account_id: number;
  content: string;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface DashboardData {
  brainlift: {
    id: number;
    original_filename: string;
    file_size: number;
    has_extracted_text: boolean;
    text_preview: string;
    created_at: string;
  } | null;
  deals: {
    id: number;
    title: string;
    description: string;
    current_status: string;
    deal_value: number;
    health_score: number;
    health_signals: { text: string; type: "positive" | "negative" | "warning" }[];
    task_count: number;
    open_task_count: number;
    updated_at: string | null;
  }[];
  is_stale: boolean;
  days_inactive: number;
  next_actions: {
    priority: "high" | "medium" | "low";
    text: string;
    action: string;
  }[];
  activity_timeline: {
    type: "note" | "task_done" | "document" | "artifact";
    text: string;
    by: string | null;
    at: string | null;
  }[];
  recent_notes: {
    id: number;
    content: string;
    created_by_name: string | null;
    created_at: string;
  }[];
  upcoming_tasks: {
    id: number;
    title: string;
    due_date: string | null;
    status: string;
    priority: string;
    assigned_to_name: string | null;
  }[];
  recent_news: {
    id: number;
    title: string;
    url: string;
    summary: string;
    category: string;
    scraped_at: string;
  }[];
  intelligence: {
    summary: string;
    key_highlights: { text: string; category: string; signal_type: string }[];
    risk_signals: { text: string; severity: string }[];
    opportunity_signals: { text: string; priority: string }[];
    generated_at: string;
  } | null;
}

export interface PipelineSummary {
  stages: Record<string, { count: number; value: number; weighted: number }>;
  total_pipeline: number;
  total_weighted: number;
  total_deals: number;
  stale_deals: {
    id: number;
    account_id: number;
    company_name: string;
    deal_title: string;
    status: string;
    deal_value: number;
    days_inactive: number;
  }[];
}

export interface ResearchReport {
  id: number;
  account_id: number;
  query: string;
  report_type: "deep_research" | "web_search";
  content: string;
  citations: { title: string; url: string }[];
  model_used: string;
  created_at: string;
}

export interface SimilarityResult {
  content: string;
  score: number;
  document_id: number;
  original_filename: string;
  chunk_index: number;
}

export interface EmbeddingStatus {
  document_id: number;
  original_filename: string;
  chunk_count: number;
  is_embedded: boolean;
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
  | "beachhead"
  | "executive_summary"
  | "roi_business_case"
  | "battle_card"
  | "talk_track"
  | "email_sequences"
  | "win_loss_analysis"
  | "qbr_brief"
  | "expansion_plan"
  | "land_expand"
  | "next_steps"
  | "meeting_prep";

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
  land_expand: "Land & Expand Strategy",
  next_steps: "Next Steps",
  meeting_prep: "Meeting Prep Brief",
};

export interface ArtifactCategory {
  label: string;
  types: PlanType[];
}

export const ARTIFACT_CATEGORIES: ArtifactCategory[] = [
  {
    label: "Strategy",
    types: ["full", "use_cases", "stakeholder_map", "deal_strategy", "beachhead", "expansion_plan", "land_expand"],
  },
  {
    label: "Sales Materials",
    types: ["executive_summary", "messaging", "roi_business_case", "battle_card", "talk_track", "email_sequences", "next_steps"],
  },
  {
    label: "Review & Analysis",
    types: ["win_loss_analysis", "qbr_brief", "meeting_prep"],
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
