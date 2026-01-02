import type { PlanDetailResponse } from '../types/plan'
import { ensureToken } from './auth'
export async function fetchPlanDetail(
  API: string,
  planId: number
) {
  const token = await ensureToken(API);

  const res = await fetch(`${API}/plans/${planId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${API}/plans/${planId} failed (${res.status}) ${text}`);
  }

  return res.json();
}