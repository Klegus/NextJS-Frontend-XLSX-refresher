import axios from 'axios';
import { ServerStatus, Plan, Comparison } from '@/types/schedule';
import { PlanData } from '@/types/schedule';
import { ApiResponse, PlansResponse } from '@/types/api';
import { facultiesResponse, pl } from '@/types/api';


const api = axios.create({
  baseURL: '/api', // Używamy lokalnych endpointów
  timeout: 10000,
});

export const getServerStatus = async (): Promise<ServerStatus> => {
  const { data } = await api.get('/status');
  return data;
};

export const getFaculties = async (category: string): Promise<string[]> => {
    try {
      const { data } = await api.get<ApiResponse<facultiesResponse>>(`/faculties/${category}`);
      
      if (!data || !data.faculties) {
        console.error('Invalid faculties data received:', data);
        return [];
      }
  
      return data.faculties;
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw error;
    }
  };

  export const getPlans = async (category: string, faculty: string): Promise<Record<string, PlanGroup>> => {
    try {
      const { data } = await api.get<PlansResponse>(`/plans/${category}/${faculty}`);
      
      // Przekształcamy tablicę w obiekt z id jako kluczami
      const plansMap = data.plans.reduce((acc, plan) => {
        acc[plan.id] = plan;
        return acc;
      }, {} as Record<string, PlanGroup>);
      
      return plansMap;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  };

export const getPlan = async (collection: string, group: string): Promise<Plan> => {
  const { data } = await api.get(`/plan/${collection}/${group}`);
  return {
    id: `${collection}-${group}`,
    html: data.plan_html,
    timestamp: data.timestamp,
    category: data.category
  };
};

export const getComparisons = async (collection: string, group: string): Promise<Comparison[]> => {
  const { data } = await api.get(`/comparisons/${collection}/${group}`);
  return data;
};

export const getActivities = async (params: { skip?: number; limit?: number }) => {
  const { data } = await api.get('/activities', { params });
  return data;
};