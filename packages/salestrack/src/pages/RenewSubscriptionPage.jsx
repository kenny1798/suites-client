import React, { useState } from 'react';
import { apiAuth } from '@suite/api-clients'; // Kita guna apiAuth sebab billing diuruskan oleh servis utama

// Ikon boleh diimport dari lucide-react atau fail ui.jsx hang
// import { AlertTriangle, CreditCard } from 'lucide-react';

export default function RenewSubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoToBilling = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Panggil endpoint yang sama macam butang 'Manage Subscription'
      const response = await apiAuth.post('/billing/create-portal-session');
      const { url } = response.data;
      if (url) {
        // Redirect pengguna terus ke Stripe Customer Portal
        window.location.href = url;
      } else {
        throw new Error('Could not retrieve billing portal URL.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to open the billing portal. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-lg text-center p-8 bg-white rounded-lg border shadow-md">
        {/* Ikon Amaran */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
          {/* <AlertTriangle className="h-6 w-6 text-amber-600" /> */}
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-800">Subscription Inactive</h1>
        <p className="mt-2 text-slate-600">
          Your access to this tool is currently suspended because your subscription is not active. Please update your billing information or renew your plan to continue.
        </p>
        
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6">
          <button
            onClick={handleGoToBilling}
            disabled={isLoading}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-slate-700 disabled:bg-slate-400"
          >
            {/* <CreditCard className="inline-block mr-2 h-4 w-4" /> */}
            {isLoading ? 'Redirecting...' : 'Go to Billing Portal'}
          </button>
        </div>
      </div>
    </div>
  );
}