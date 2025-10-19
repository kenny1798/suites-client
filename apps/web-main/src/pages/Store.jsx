// Simpan sebagai: src/pages/Store.jsx

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {apiAuth} from '@suite/api-clients';
import PricingCard from '../components/PricingCard.jsx';

// Import semua custom hooks yang diperlukan
import { useToolDetails } from '../hooks/useToolDetails';
import { useMySubs } from '../hooks/useMySubs';

export default function Store() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toolSlug = searchParams.get('tool');

  // State untuk UI
  const [billingInterval, setBillingInterval] = useState('month'); // 'month' atau 'year'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Panggil hooks untuk dapatkan data
  const { loading: loadingTool, data: tool, error: errorTool } = useToolDetails(toolSlug);
  const { loading: loadingSubs, map: subsMap, error: errorSubs } = useMySubs();

  // Gabungkan state loading dan error dari kedua-dua hooks
  const isLoading = loadingTool || loadingSubs;
  const error = errorTool || errorSubs;

  // Fungsi untuk handle klik butang subscribe
  const handleSubscribe = async (priceId) => {
    setIsSubmitting(true);
    try {
      const response = await apiAuth.post('/billing/create-checkout-session', {
        priceId: priceId,
      });
      
      const { url } = response.data;
      if (url) {
        window.location.href = url; // Redirect ke Stripe Checkout
      } else {
        throw new Error('Could not retrieve checkout URL.');
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Paparkan mesej loading, error, atau jika tool tak dijumpai
  if (isLoading) return <div className="p-6 text-center">Loading plans...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  if (!tool) return <div className="p-6 text-center">Tool not found. <button onClick={() => navigate('/marketplace')} className="text-blue-600 hover:underline">Go to Marketplace</button></div>;

  // Dapatkan langganan spesifik untuk tool ini dari subsMap
  const currentSub = subsMap[toolSlug];

  // Tapis pelan berdasarkan pilihan bulanan/tahunan
  const plans = tool.plans.filter(p => p.interval === billingInterval);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{tool.name} Pricing</h1>
        <p className="mt-2 text-lg text-slate-600">{tool.description}</p>
      </header>
      
      {/* Toggle Bulanan/Tahunan */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full border p-1 bg-slate-100">
          <button onClick={() => setBillingInterval('month')} className={`px-4 py-1 rounded-full text-sm font-semibold ${billingInterval === 'month' ? 'bg-white shadow' : ''}`}>Monthly</button>
          <button onClick={() => setBillingInterval('year')} className={`px-4 py-1 rounded-full text-sm font-semibold ${billingInterval === 'year' ? 'bg-white shadow' : ''}`}>Yearly</button>
        </div>
      </div>

      {/* Grid untuk kad harga */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <PricingCard
            key={plan.code}
            plan={plan}
            currentSub={currentSub}
            onSubscribe={handleSubscribe}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  );
}