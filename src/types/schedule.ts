export interface ServerStatus {
    maintenance_mode: boolean;
    status: string;
    last_check?: string;
  }
  
  export interface Plan {
    id: string;
    html: string;
    timestamp: string;
    category: string | null;
    groups?: Record<string, string[]>;
  }
  export interface PlanData {
    groups: string[];
    timestamp: string;
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
  }
  
  export interface WeekRange {
    start: Date;
    end: Date;
  }export interface Plan {
  id: string;
  html: string;
  timestamp: string;
  category: string;
}

export interface ServerStatus {
  status: string;
  last_check: string;
  maintenance_mode: boolean;
}

export interface SelectionState {
  category: string;
  faculty: string;
  plan: string;
  group: string;
}

export interface WeekRange {
  start: Date;
  end: Date;
}

export interface PlanGroup {
  id: string;
  name: string;
  groups: string[];
  timestamp: string;
}

export interface Comparison {
  timestamp: string;
  newer_plan_timestamp: string;
  older_plan_timestamp: string;
  results: Record<string, string>;
}
