import { toolsApi } from '@suite/api-clients';

export async function listActivities(oppId, teamId) {
  const res = await toolsApi.get(`/api/salestrack/opportunities/${oppId}/activities`, { params: { teamId } });
  return res.data; // { items: [...] }
}

export async function createActivity(oppId, body) {
  // { teamId, type, status, outcome?, notes?, scheduledAt?, completedAt? }
  const res = await toolsApi.post(`/api/salestrack/opportunities/${oppId}/activities`, body);
  return res.data;
}
