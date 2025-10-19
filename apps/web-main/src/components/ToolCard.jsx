import React from 'react';
import { useNavigate } from 'react-router-dom';

// Helper untuk tentukan teks & aksi butang CTA
function getCardCTA(subscription, tool) {
  const status = subscription?.status?.toLowerCase();

  if (['active', 'trialing'].includes(status)) {
    return { text: 'Open Tool', action: 'open', primary: true };
  }
  if (status === 'past_due') {
    return { text: 'Manage Billing', action: 'billing', primary: true };
  }
  if (status === 'expired' || status === 'canceled') {
    return { text: 'Resubscribe', action: 'subscribe', primary: true };
  }
  
  // Jika tiada langganan
  const model = tool.pricingModel || 'subscription'; // Anggap 'subscription' default
  if (model === 'freemium') {
    return { text: 'Use for Free', action: 'open', primary: false };
  }
  if (model === 'trial') {
    return { text: 'Start Free Trial', action: 'subscribe', primary: true };
  }
  
  return { text: 'Learn More', action: 'subscribe', primary: true };
}

export default function ToolCard({ tool, subscription }) {
  const navigate = useNavigate();
  
  const cta = getCardCTA(subscription, tool);

  const handleCtaClick = () => {
    if (cta.action === 'open') {
      navigate(tool.basePath);
    }
    if (cta.action === 'subscribe') {
      // Bawa pengguna ke laman store/billing dengan info tool
      navigate(`/store?tool=${tool.slug}`);
    }
    if (cta.action === 'billing') {
      navigate('/billing');
    }
  };

  return (
    <div className="flex flex-col rounded-lg border bg-white shadow-sm transition hover:shadow-md">
      {/* Bahagian Header Kad */}
      <div className="p-5 border-b">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-2xl">
            {tool.icon || '🚀'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
            <p className="text-sm text-slate-500">{tool.category || 'Business Tool'}</p>
          </div>
        </div>
      </div>

      {/* Bahagian Badan Kad (Content) */}
      <div className="p-5 flex-grow">
        <p className="text-sm text-slate-600 line-clamp-3">
          {tool.description || 'No description available.'}
        </p>
      </div>

      {/* Bahagian Footer Kad (CTA) */}
      <div className="p-5 border-t mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-slate-500">
            {tool.pricingModel || 'Subscription'}
          </span>
          <button
            onClick={handleCtaClick}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              cta.primary
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            {cta.text}
          </button>
        </div>
      </div>
    </div>
  );
}