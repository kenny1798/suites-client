// ToolCard.jsx — FULL (fixed footer button at bottom + no-sub shows button only)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewBadge } from './ui.jsx';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/*
----------------------------------------------------------------
Helpers
----------------------------------------------------------------
*/
const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const daysLeft = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
  return d > 0 ? d : 0;
};

function getBadgeInfo(subscription) {
  const status = subscription?.status?.toLowerCase();

  switch (status) {
    case 'trialing':
      return { text: 'Trialing', variant: 'variant-blue' };
    case 'active':
      return { text: 'Active', variant: 'variant-green' };
    case 'expired':
      return { text: 'Expired', variant: 'variant-red' };
    case 'canceled':
      return { text: 'Canceled', variant: 'variant-slate' };
    case 'past_due':
      return { text: 'Past Due', variant: 'variant-amber' };
    default:
      return null;
  }
}

function getFooterInfo(subscription) {
  const status = subscription?.status?.toLowerCase();
  if (!status) return null; // tiada subscription => tiada footer info

  switch (status) {
    case 'trialing': {
      const left = daysLeft(subscription.trialEnd);
      return {
        text: `Trial ends on: ${formatDate(subscription.trialEnd)} (${left}d left)`,
        icon: <Clock className="h-3 w-3 text-blue-600" />,
      };
    }
    case 'active':
      return {
        text: `Active Plan: ${subscription.Plan?.name || 'Pro'}`,
        icon: <CheckCircle className="h-3 w-3 text-green-600" />,
      };
    case 'expired':
      return {
        text: 'Your subscription has expired.',
        icon: <XCircle className="h-3 w-3 text-red-600" />,
      };
    case 'canceled':
      return {
        text: 'Your subscription has been canceled.',
        icon: <XCircle className="h-3 w-3 text-slate-600" />,
      };
    case 'past_due':
      return {
        text: 'Please update your payment.',
        icon: <AlertTriangle className="h-3 w-3 text-amber-600" />,
      };
    default:
      return null;
  }
}

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

  // Tiada subscription
  const model = tool.pricingModel || 'subscription';
  if (model === 'freemium') {
    return { text: 'Use for Free', action: 'open', primary: false };
  }
  if (model === 'trial') {
    return { text: 'Start Free Trial', action: 'subscribe', primary: true };
  }
  return { text: 'Learn More', action: 'subscribe', primary: true };
}

/*
----------------------------------------------------------------
Komponen Utama
----------------------------------------------------------------
*/
export default function ToolCard({ tool, subscription }) {
  const navigate = useNavigate();

  const cta = getCardCTA(subscription, tool);
  const badge = getBadgeInfo(subscription);
  const footerInfo = getFooterInfo(subscription);

  const handleCtaClick = () => {
    if (cta.action === 'open') navigate(tool.basePath);
    if (cta.action === 'subscribe') navigate(`/store?tool=${tool.slug}`);
    if (cta.action === 'billing') navigate('/billing');
  };

  // Button style sentiasa penuh + bawah
  const buttonClassName = `
    w-full rounded-md px-4 py-2 text-sm font-semibold transition
    ${cta.primary
      ? 'bg-slate-900 text-white hover:bg-slate-700'
      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
    }
  `;

  return (
    <div className="flex flex-col rounded-lg border bg-white shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-2xl">
              {tool.icon || '🚀'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{tool.name}</h3>
              <p className="text-sm text-slate-500">{tool.category || 'Business Tool'}</p>
            </div>
          </div>
          {badge && <NewBadge className={badge.variant}>{badge.text}</NewBadge>}
        </div>
      </div>

      {/* Body (min height supaya footer kekal di bawah & tinggi kad konsisten) */}
      <div className="p-5 flex-grow min-h-[84px]">
        <p className="text-sm text-slate-600 line-clamp-3">
          {tool.description || 'No description available.'}
        </p>
      </div>

      {/* Footer — sentiasa letak di bawah */}
      <div className="p-5 border-t mt-auto">
        {footerInfo ? (
          // Ada subscription → tunjuk info + button
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
              {footerInfo.icon}
              <span className="font-medium">{footerInfo.text}</span>
            </div>
            <button onClick={handleCtaClick} className={buttonClassName}>
              {cta.text}
            </button>
          </div>
        ) : (
          // TIADA subscription → tunjuk BUTTON SAHAJA (ikut request)
          <div className="flex flex-col">
            <button onClick={handleCtaClick} className={buttonClassName}>
              {cta.text}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
