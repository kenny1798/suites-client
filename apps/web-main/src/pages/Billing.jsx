// Ganti kod penuh dalam: src/pages/Billing.jsx

import React, { useState } from 'react';
import {apiAuth} from '@suite/api-clients';
import { useMySubs } from '../hooks/useMySubs';
import { useInvoices } from '../hooks/useInvoices';
import SubscriptionItem from '../components/SubscriptionItem.jsx'; // Komponen baru

export default function Billing() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Panggil hook untuk dapatkan data semua langganan pengguna
  const { loading: loadingSubs, data: subscriptions, error: errorSubs } = useMySubs();
  const { loading: loadingInvoices, data: invoices, error: errorInvoices } = useInvoices();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await apiAuth.post('/billing/create-portal-session');
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open billing portal', error);
      alert('Could not open the billing portal. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Billing & Subscriptions
        </h1>
        <p className="mt-1 text-slate-600">
          Manage your subscriptions and view your billing history.
        </p>
      </header>

      {/* Bahagian Pengurusan Utama */}
      <div className="p-6 bg-white rounded-lg border mb-8">
        <h2 className="text-lg font-semibold">Manage your subscription</h2>
        <p className="text-slate-600 mt-1 mb-4">
          Need to change your plan, cancel, or update your payment method? You can do it all in the billing portal.
        </p>
        <button
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="rounded-md bg-slate-900 px-4 py-2 text-white font-semibold hover:bg-slate-700 disabled:bg-slate-400"
        >
          {isLoading ? 'Loading...' : 'Open Billing Portal'}
        </button>
      </div>

      {/* Bahagian Senarai Langganan */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Subscriptions</h2>
        {loadingSubs ? (
          <p>Loading your subscriptions...</p>
        ) : errorSubs ? (
          <p className="text-red-600">Failed to load subscriptions.</p>
        ) : subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map(sub => (
              <SubscriptionItem key={sub.id} subscription={sub} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">You don't have any active subscriptions yet.</p>
        )}
      </div>

      {/* Bahagian Senarai Invoice */}
      <div>
        <h2 className="text-xl font-bold mb-4">Invoice History</h2>
        {loadingInvoices ? (
          <p>Loading invoice history...</p>
        ) : errorInvoices ? (
          <p className="text-red-600">Failed to load invoices.</p>
        ) : invoices.length > 0 ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">RM{invoice.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        Download PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">You have no invoices yet.</p>
        )}
      </div>
    </div>
  );
}