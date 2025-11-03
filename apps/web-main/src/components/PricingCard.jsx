import React from 'react';
import { useNavigate } from 'react-router-dom';
import salestrackPlans from '../data/pricingDescriptions.json';

export default function PricingCard({ plan, currentSub, onSelectPlan, isSubmitting }) {
  const navigate = useNavigate();
  const planData = salestrackPlans[plan.code] || {};
  const isCurrentPlan = currentSub?.planCode === plan.code;
  const subStatus = String(currentSub?.status || '').toLowerCase();

  // Determine button behavior
  const getButtonState = () => {
    if (!currentSub)
      return { text: 'Start Free Trial', variant: 'default', action: 'select' };
    if (subStatus === 'trialing' && isCurrentPlan)
      return { text: 'On Trial', variant: 'indigo', action: 'none' };
    if (subStatus === 'active' && isCurrentPlan)
      return { text: 'Manage Billing', variant: 'blue', action: 'manage' };
    if (subStatus === 'expired')
      return { text: 'Go to Billing', variant: 'slate', action: 'manage' };
    if (subStatus === 'canceled')
      return { text: 'Resubscribe', variant: 'slate', action: 'select' };
    return { text: 'Manage', variant: 'default', action: 'manage' };
  };

  const button = getButtonState();

  const VARIANT_CLASS = {
    default: 'border border-slate-200 bg-white shadow-lg',
    indigo: 'border-2 border-indigo-600 bg-indigo-50',
    blue: 'border-2 border-blue-600 bg-blue-50',
    slate: 'border-2 border-slate-500 bg-slate-50'
  };

  const cardClass = `relative flex flex-col rounded-lg p-8 text-center transition ${VARIANT_CLASS[button.variant]}`;

  const handleClick = () => {
    if (button.action === 'select') onSelectPlan(plan);
    if (button.action === 'manage') navigate('/billing');
  };

  return (
    <div className={cardClass}>
      {planData.badge && (
        <div className="absolute right-4 top-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
          {planData.badge}
        </div>
      )}

      <h3 className="text-lg font-semibold text-slate-800">{planData.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{planData.tagline}</p>

      <div className="my-6">
        <span className="text-5xl md:text-4xl font-bold tracking-tight text-slate-800">
          RM{planData.price.toFixed(2)}
        </span>
        <p className="text-slate-500">/{planData.interval}</p>
      </div>

      <ul className="space-y-4 text-left my-8 flex-grow text-sm">
        {planData.features?.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-slate-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        disabled={isSubmitting}
        className={`mt-auto w-full rounded-md px-4 py-3 font-semibold text-white transition ${
          button.variant === 'indigo'
            ? 'bg-indigo-600 hover:bg-indigo-700'
            : button.variant === 'blue'
            ? 'bg-blue-600 hover:bg-blue-700'
            : button.variant === 'slate'
            ? 'bg-slate-700 hover:bg-slate-800'
            : 'bg-slate-900 hover:bg-slate-700'
        }`}
      >
        {isSubmitting ? 'Processing...' : button.text}
      </button>
    </div>
  );
}
