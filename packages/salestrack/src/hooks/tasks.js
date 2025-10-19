import { toolsApi } from '@suite/api-clients';

export async function listTasks(params) {
  // { teamId, scope?, status?, range?, assigneeId? }
  const res = await toolsApi.get('/api/salestrack/tasks', { params });
  return res.data; // { items, total }
}

export async function createTask(oppId, body) {
  // { teamId, assigneeId, type, note?, dueAt }
  const res = await toolsApi.post(`/api/salestrack/opportunities/${oppId}/tasks`, body);
  return res.data;
}

export async function patchTask(id, body) {
  const res = await toolsApi.patch(`/api/salestrack/tasks/${id}`, body);
  return res.data;
}
