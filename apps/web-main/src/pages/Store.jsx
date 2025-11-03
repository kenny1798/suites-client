import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiAuth } from '@suite/api-clients';
import PricingCard from '../components/PricingCard.jsx';
import { useToolDetails } from '../hooks/useToolDetails';
import { useMySubs } from '@suite/hooks';
import NotificationModal from '../components/NotificationModal.jsx';

export default function Store() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toolSlug = searchParams.get('tool');
  const [isSubmitting, setIsSubmitting] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
  });

  const { loading: loadingTool, data: tool, error: errorTool } = useToolDetails(toolSlug);
  const { loading: loadingSubs, map: subsMap } = useMySubs();

  const isLoading = loadingTool || loadingSubs;
  const currentSub = subsMap[toolSlug];
  const subStatus = String(currentSub?.status || '').toLowerCase();
  const isExpired = subStatus === 'expired';

  const handlePlanAction = async (plan) => {
    setIsSubmitting(plan.code);
    try {
      if (!currentSub) {
        if (plan.trialDays > 0) {
          await apiAuth.post('/billing/start-trial', { toolId: tool.slug, planCode: plan.code });
        } else {
          await apiAuth.post('/billing/resubscribe/from-canceled', { toolId: tool.slug, planCode: plan.code });
        }
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Plan Activated',
          message: 'Your plan is now active. Redirecting...',
          onConfirm: () => (window.location.href = tool.basePath),
        });
      } else if (subStatus === 'canceled') {
        await apiAuth.post('/billing/resubscribe/from-canceled', { toolId: tool.slug, planCode: plan.code });
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Welcome Back!',
          message: 'Your subscription has been reactivated.',
          onConfirm: () => (window.location.href = tool.basePath),
        });
      } else {
        navigate('/billing');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: msg,
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading plans...</div>;
  if (!tool) return <div className="p-6 text-center">Tool not found.</div>;

  const plans = (tool.plans || [])
    .filter((p) => p.interval === 'month')
    .sort((a, b) => a.priceCents - b.priceCents);

  return (
    <div className="relative p-4 sm:p-6 max-w-6xl mx-auto">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          {tool.name} Pricing
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Choose the plan that scales with your business — from solo agents to enterprise sales organizations.
        </p>
      </header>

      {isExpired && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <b>Subscription Expired:</b> Please clear outstanding invoices in{' '}
          <button
            className="text-amber-900 underline"
            onClick={() => navigate('/billing')}
          >
            Billing
          </button>{' '}
          before reactivation.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.code}
            plan={plan}
            currentSub={currentSub}
            onSelectPlan={handlePlanAction}
            isSubmitting={isSubmitting === plan.code}
          />
        ))}
      </div>

      <NotificationModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
    </div>
  );
}
