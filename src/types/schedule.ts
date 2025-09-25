export interface ServerStatus {
  maintenance_mode: boolean;
  status: string;
  last_check?: string;
  check_interval?: number;
}

export interface Plan {
  id: string;
  html: string;
  htmlPerGroup?: Record<string, string>; // Individual HTML for each group in mixed plans
  timestamp: string;
  category: string | null;
  groups?: Record<string, string[]>;
  mixed?: boolean; // Flag indicating this is a mixed plan
}

export interface PlanData {
  groups: string[] | Record<string, any>; // Can be array or object from API
  timestamp: string;
  mixed?: boolean;
  groupColumnInfo?: Record<string, number>;
}

export interface Comparison {
  timestamp: string;
  newer_plan_timestamp: string;
  older_plan_timestamp: string;
  results: Record<string, string>;
}

export interface PlansResponse {
  plans: Record<string, PlanData>;
}

export interface Activity {
  id: string;
  title: string;
  content: string;
  type: 'folder' | 'resource' | 'page' | 'label';
  url?: string;
  created_at: string;
  content_html?: string;
  content_text?: string;
  images?: Array<{
    src: string;
    alt: string;
  }>;
}

export interface SelectionState {
  category: string;
  faculty: string;
  plan: string;
  group: string;
  specialization?: string; // For mixed plans - specialization group
  selectedGroups?: string[]; // For mixed plans - multiple group selection
}

export interface WeekRange {
  start: Date;
  end: Date;
}

export interface PlanGroup {
  id: string;
  name: string;
  groups: string[] | Record<string, any>; // Can be array or object from API
  timestamp: string;
  mixed?: boolean; // Flag for mixed plans
  groupColumnInfo?: Record<string, number>; // Column count per group
}