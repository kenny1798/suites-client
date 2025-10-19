// simple helpers
export function daysUntil(iso) {
  if (!iso) return 0;
  const end = new Date(iso), now = new Date();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

// entitlements.features[FEATURE_KEY] = { enabled, limit }
export function hasFeature(entitlements, featureKey) {
  if (!featureKey) return true;
  const f = entitlements?.features?.[featureKey];
  return !!f?.enabled;
}

// badge untuk SalesTrack – baca global entitlements dari AuthProvider
export function toolStatus(entitlements) {
  const s = entitlements?.status || 'none';
  const trialLeft = entitlements?.trialActive ? daysUntil(entitlements?.expiresAt) : 0;

  if (s === 'active') return { access: 'open', label: 'Pro' };
  if (s === 'trialing') return { access: 'open', label: `Trial • ${trialLeft}d left` };
  if (s === 'past_due') return { access: 'locked', label: 'Past Due' };
  if (s === 'canceled') return { access: 'locked', label: 'Canceled' };
  return { access: 'locked', label: 'Locked' };
}
