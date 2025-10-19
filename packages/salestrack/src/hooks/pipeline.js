import { toolsApi } from '@suite/api-clients';

export async function getTeamStatuses(teamId) {
  const res = await toolsApi.get(`/api/salestrack/teams/${teamId}/statuses`);
  return res.data;
}
export async function replaceTeamStatuses(teamId, body) {
  const res = await toolsApi.post(`/api/salestrack/teams/${teamId}/statuses`, body);
  return res.data;
}
