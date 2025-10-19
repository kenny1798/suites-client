import { toolsApi } from '@suite/api-clients';

export async function listContacts(teamId) {
  const res = await toolsApi.get('/api/salestrack/contacts', { params: { teamId } });
  return res.data;
}
export async function createContact(body) {
  const res = await toolsApi.post('/api/salestrack/contacts', body);
  return res.data;
}
