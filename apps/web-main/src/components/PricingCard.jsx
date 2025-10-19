import React from 'react';

// Fungsi helper masih sama seperti sebelum ini
function getCardState(plan, currentSub) {
  // ... (logik dari respons sebelum ini dikekalkan) ...
  // Tambah satu property baru: isPopular
  const isPopular = !!plan.isPopular;

  if (!currentSub) {
    if (plan.trialDays > 0) return { text: 'Start Free Trial', action: 'subscribe', disabled: false, isCurrent: false, isPopular };
    return { text: 'Subscribe Now', action: 'subscribe', disabled: false, isCurrent: false, isPopular };
  }
  const subStatus = currentSub.status.toLowerCase();
  const isCurrentPlan = currentSub.planCode === plan.code;
  const planRank = plan.rank || 0;
  const currentPlanRank = currentSub.plan?.rank || 0;

  if (subStatus === 'active') {
    if (isCurrentPlan) return { text: 'Current Plan', action: 'manage', disabled: true, isCurrent: true, badge: 'Active', isPopular };
    if (planRank > currentPlanRank) return { text: 'Upgrade', action: 'manage', disabled: false, isCurrent: false, isPopular };
    return { text: 'Downgrade', action: 'manage', disabled: false, isCurrent: false, isPopular };
  }
  if (subStatus === 'trialing') {
    if (isCurrentPlan) return { text: 'Subscribe Now', action: 'subscribe', disabled: false, isCurrent: true, badge: 'Trial Active', isPopular };
    if (planRank > currentPlanRank) return { text: 'Upgrade', action: 'manage', disabled: false, isCurrent: false, isPopular };
    return { text: 'Switch Plan', action: 'manage', disabled: false, isCurrent: false, isPopular };
  }
  if (subStatus === 'expired' || subStatus === 'canceled') {
    if (isCurrentPlan) return { text: 'Resubscribe', action: 'subscribe', disabled: false, isCurrent: true, badge: 'Expired', isPopular };
    return { text: 'Subscribe', action: 'subscribe', disabled: false, isCurrent: false, isPopular };
  }
  return { text: 'Learn More', action: 'subscribe', disabled: false, isCurrent: false, isPopular };
}

export default function PricingCard({ plan, currentSub, onSubscribe, isSubmitting }) {
  const priceInRM = (plan.priceCents / 100).toFixed(2);
  const state = getCardState(plan, currentSub);
  console.log('state:', plan);

  const handleButtonClick = () => {
    if (state.action === 'subscribe') onSubscribe(plan.stripePriceId);
    if (state.action === 'manage') alert('Redirecting to billing management...'); // onManageSubscription();
  };

  // Kelas dinamik untuk highlight kad 'paling popular' atau 'pelan semasa'
  const cardClassName = `relative flex flex-col rounded-lg p-8 text-center transition ${
    state.isPopular ? 'border-2 border-indigo-600 bg-white shadow-2xl' :
    state.isCurrent ? 'border-2 border-indigo-600 bg-indigo-50' : 
    'border border-slate-200 bg-white shadow-lg'
  }`;
  
  const buttonClassName = `mt-auto w-full rounded-md px-4 py-3 font-semibold transition disabled:bg-slate-400 disabled:cursor-not-allowed ${
    state.isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
    'bg-slate-900 text-white hover:bg-slate-700'
  }`;

  return (
    <div className={cardClassName}>
      {/* Badge untuk "Most Popular" atau status semasa */}
      {state.isPopular && !state.badge && (
        <div className="absolute top-0 -translate-y-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </div>
      )}
      {state.isCurrent && state.badge && (
        <div className="absolute top-0 -translate-y-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
          {state.badge}
        </div>
      )}

      {/* Nama & Penerangan Pelan */}
      <h3 className="text-lg font-semibold text-slate-800">{plan.name}</h3>
      
      {/* Harga (Dengan Saiz Teks Responsif) */}
      <div className="my-6">
        <span className="text-5xl md:text-4xl font-bold tracking-tight text-slate-800">RM{priceInRM}</span>
        <p className="text-slate-500">/month</p>
      </div>

      <ul className="space-y-4 text-left my-8 flex-grow text-sm">
        {(plan.PlanFeatures || []).map((planFeature, index) => (
          <li key={index} className="flex items-center gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {/* Paparkan nama feature dari objek nested */}
            <span className="text-slate-700">{planFeature.Feature.name}</span>
          </li>
        ))}
      </ul>
      
      {/* Senarai Features (Yang Hilang Sebelum Ni) */}
      <ul className="space-y-4 text-left my-8 flex-grow text-sm">
        {(plan.features || []).map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-slate-700">{feature.name || feature}</span>
          </li>
        ))}
      </ul>

      {/* Butang CTA (Yang Hilang Sebelum Ni) */}
      <button
        onClick={handleButtonClick}
        disabled={isSubmitting || state.disabled}
        className={buttonClassName}
      >
        {isSubmitting ? 'Processing...' : state.text}
      </button>
    </div>
  );
}