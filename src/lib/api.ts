import axios from 'axios';
import { ServerStatus, Plan, Comparison, PlanGroup } from '@/types/schedule';
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

      console.log('Plans API response:', data.plans);

      // Przekształcamy tablicę w obiekt z id jako kluczami
      const plansMap = data.plans.reduce((acc, plan) => {
        acc[plan.id] = plan;
        console.log(`Plan ${plan.id}: mixed=${plan.mixed}, groups:`, Object.keys(plan.groups || []));
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
    html: data.plan_html || data.html || data,
    timestamp: data.timestamp,
    category: data.category,
    mixed: data.mixed
  };
};

/**
 * Fetch multiple groups for mixed plans
 */
export const getMixedPlanGroups = async (
  collection: string,
  groups: string[]
): Promise<{ htmls: Record<string, string>; timestamp: string; category?: string }> => {
  try {
    console.log('Fetching mixed plan for collection:', collection, 'groups:', groups);

    // Use the new POST endpoint for mixed plans
    const { data } = await api.post(`/plan/${collection}/mixed`, {
      groups: groups
    });

    console.log('API Response for mixed plan:', data);
    console.log('Group HTMLs keys:', Object.keys(data.group_htmls || {}));

    // Log a sample of the HTML to see structure
    if (data.group_htmls) {
      Object.entries(data.group_htmls).forEach(([group, html]) => {
        console.log(`HTML for ${group} (first 500 chars):`, html.substring(0, 500));
      });
    }

    // Return both the HTML data and timestamp
    return {
      htmls: data.group_htmls || {},
      timestamp: data.timestamp,
      category: data.category
    };
  } catch (error) {
    console.error('Error fetching mixed plan groups:', error);
    // Fallback to fetching groups individually if POST endpoint fails
    try {
      const promises = groups.map(async (group) => {
        const { data } = await api.get(`/plan/${collection}/${group}`);
        return {
          group,
          html: data.plan_html || data.html || data,
          timestamp: data.timestamp,
          category: data.category
        };
      });

      const results = await Promise.all(promises);
      const htmlPerGroup: Record<string, string> = {};
      let timestamp = '';
      let category = '';

      results.forEach(({ group, html, timestamp: ts, category: cat }) => {
        if (html) {
          htmlPerGroup[group] = html;
        }
        // Use the first timestamp and category found
        if (ts && !timestamp) {
          timestamp = ts;
        }
        if (cat && !category) {
          category = cat;
        }
      });

      return {
        htmls: htmlPerGroup,
        timestamp: timestamp || new Date().toISOString(),
        category
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Get plan metadata to check if it's mixed
 */
export const getPlanMetadata = async (collection: string): Promise<{
  mixed?: boolean;
  groups?: string[];
  groupColumnInfo?: Record<string, number>;
}> => {
  try {
    // Collection format: plans_{category}_{faculty}_{rest}
    // First check if we cached the plans data in SelectionControls
    const cachedKey = `plans_cache_${collection}`;
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem(cachedKey) : null;
    if (cached) {
      const cachedData = JSON.parse(cached);
      // Cache for 5 minutes
      if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
        console.log('Using cached plan metadata for', collection);
        return cachedData.metadata;
      }
    }

    // Parse collection name properly
    // Format: plans_st_informatyka_... or plans_nst_informatyka_...
    let category = '';
    let faculty = '';

    if (collection.includes('_st_')) {
      category = 'st';
      const afterCategory = collection.split('_st_')[1];
      faculty = afterCategory.split('_')[0];
    } else if (collection.includes('_nst_')) {
      category = 'nst';
      const afterCategory = collection.split('_nst_')[1];
      faculty = afterCategory.split('_')[0];
    } else if (collection.includes('_nst-online_')) {
      category = 'nst-online';
      const afterCategory = collection.split('_nst-online_')[1];
      faculty = afterCategory.split('_')[0];
    }

    console.log(`Parsed collection: category="${category}", faculty="${faculty}" from "${collection}"`);

    if (category && faculty) {
      const plans = await getPlans(category, faculty);

      // Find the plan by matching collection name
      const plan = plans[collection];

      if (plan) {
        const metadata = {
          mixed: plan.mixed,
          groups: Array.isArray(plan.groups) ? plan.groups : Object.keys(plan.groups || {}),
          groupColumnInfo: plan.groupColumnInfo
        };

        // Cache the result
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(cachedKey, JSON.stringify({
            metadata,
            timestamp: Date.now()
          }));
        }

        console.log('Found plan metadata:', metadata);
        return metadata;
      } else {
        console.warn(`Plan not found in response for collection: ${collection}`);
      }
    }

    console.warn('Failed to parse collection name or find plan, defaulting to mixed=false');
    return { mixed: false };
  } catch (error) {
    console.error('Error fetching plan metadata:', error);
    return { mixed: false };
  }
};

export const getComparisons = async (collection: string, group: string): Promise<Comparison[]> => {
  const { data } = await api.get(`/comparisons/${collection}/${group}`);
  return data;
};

export const getActivities = async (params: { skip?: number; limit?: number }) => {
  const { data } = await api.get('/activities', { params });
  return data;
};