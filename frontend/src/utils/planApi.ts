import type { PlanDetailResponse } from '../types/plan'

export async function fetchPlanDetail(API: string, planId: number): Promise<PlanDetailResponse> {
  const res = await fetch(`${API}/plans/${planId}/`, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET /plans/${planId} failed (${res.status}) ${text}`)
  }
  return res.json()
}

