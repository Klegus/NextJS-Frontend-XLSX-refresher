
import { Activity } from '@/types/schedule';

export interface ApiResponse<T> {
    data: T;
    error?: string;
    timestamp?: string;
  }
  
  export interface PlanResponse {
    plan_html: string;
    timestamp: string;
    category: string | null;
  }
  interface PlansResponse {
    plans: PlanGroup[];
  }
  interface PlanGroup {
    groups: Record<string, string>; // nazwa_grupy -> html_planu
    id: string;
    name: string;
  }
  
  export interface FacultyResponse {
    faculties: string[];
  }
  
  export interface ApiResponse<T> {
    data: T;
    status?: string;
    error?: string;
  }
  
  export interface FacultiesResponse {
    faculties: string[];
  }
  
  
  
  interface PlanData {
    id: string; // Dodaj pole id
    name: string;
    groups: string[];
    timestamp: string;
  }
  export interface ActivitiesResponse {
    activities: Activity[];
    total: number;
    page: number;
    limit: number;
  }