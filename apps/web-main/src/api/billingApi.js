// src/api/billingApi.js
import { apiAuth } from '@suite/api-clients';

export const billingApi = {
  account: () => apiAuth.get('/billing/account').then(r => r.data),
  invoices: (params = {}) => apiAuth.get('/billing/invoices', { params }).then(r => r.data),
  invoice: (id) => apiAuth.get(`/billing/invoices/${id}`).then(r => r.data),
  payInvoice: (id) => apiAuth.post(`/billing/invoices/${id}/pay`).then(r => r.data),
  cancelToolSub: (id) => apiAuth.post(`/billing/tool-subscriptions/${id}/cancel`).then(r => r.data),
  resubFromCanceled: (body) => apiAuth.post('/billing/resubscribe/from-canceled', body).then(r => r.data),
};
