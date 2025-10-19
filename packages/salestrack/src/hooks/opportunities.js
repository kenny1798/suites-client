import { toolsApi } from '@suite/api-clients';

export async function listOpportunities(teamId) {
  const res = await toolsApi.get('/api/salestrack/opportunities', { params: { teamId } });
  return res.data; // array of opportunities
}

export async function createOpportunity(body) {
  // { teamId, name, value, contactId }
  const res = await toolsApi.post('/api/salestrack/opportunities', body);
  return res.data;
}

export async function updateOpportunity(id, body) {
  // body mesti ada teamId
  const res = await toolsApi.put(`/api/salestrack/opportunities/${id}`, body);
  return res.data;
}

export async function moveOpportunity(id, { teamId, toStatusId, lostReason }) {
  const res = await toolsApi.post(`/api/salestrack/opportunities/${id}/move`, { teamId, toStatusId, lostReason });
  return res.data;
}

export async function assignOpportunity(id, { teamId, toUserId }) {
  const res = await toolsApi.post(`/api/salestrack/opportunities/${id}/assign`, { teamId, toUserId });
  return res.data;
}
