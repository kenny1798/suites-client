import { toolsApi } from '@suite/api-clients';

export async function getTimeline(oppId, teamId) {
  const res = await toolsApi.get(`/api/salestrack/opportunities/${oppId}/timeline`, { params: { teamId } });
  return res.data; // { items: [...] }
}
