// packages/utils/src/entitlements.js

/** ---------- Shared helpers (sedia ada + dikekalkan) ---------- **/

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

  if (s === 'active')   return { access: 'open',   label: 'Pro' };
  if (s === 'trialing') return { access: 'open',   label: `Trial • ${trialLeft}d left` };
  if (s === 'past_due') return { access: 'locked', label: 'Past Due' };
  if (s === 'canceled') return { access: 'locked', label: 'Canceled' };
  return { access: 'locked', label: 'Locked' };
}

/** ---------- New entitlement helpers (No.1 requirement) ---------- **/

export function normalizeStatus(s) {
  return (s ?? '').toString().trim().toLowerCase();
}

/**
 * OWNER dianggap "active" hanya jika subscription status = active | trialing.
 * (past_due/canceled/expired = tidak active untuk OWNER entitlements)
 */
export function isSubActiveForOwner(subStatus) {
  return ['active', 'trialing'].includes(normalizeStatus(subStatus));
}

/**
 * Base entitlements ikut tier plan.
 * - individual: 1 team (solo), tak boleh invite
 * - team:       1 team, boleh invite
 * - enterprise: multi-team (Infinity), boleh invite
 */
function baseEntitlementsFromPlan(planTier) {
  switch ((planTier || '').toLowerCase()) {
    case 'enterprise':
      return { planTier: 'enterprise', maxTeams: Infinity, canInvite: true,  canCreateTeam: true };
    case 'team':
      return { planTier: 'team',       maxTeams: 1,        canInvite: true,  canCreateTeam: true };
    case 'individual':
    default:
      return { planTier: 'individual', maxTeams: 1,        canInvite: false, canCreateTeam: true };
  }
}

/**
 * Ambil entitlement asas untuk SalesTrack:
 *   1) Prefer `user.entitlements.salestrack` (kalau server dah bagi)
 *   2) Fallback derive dari `sub.planCode` (e.g. *_TEAM, *_ENT, *_INDIVIDUAL)
 */
export function getRawSalestrackEnt(user, sub) {
  const ent = user?.entitlements?.salestrack;
  if (ent) return ent;

  const code = (sub?.planCode || '').toLowerCase();
  const tier =
    code.includes('enterprise') || code.endsWith('_ent') ? 'enterprise' :
    code.includes('team')                                ? 'team' :
                                                            'individual';
  return baseEntitlementsFromPlan(tier);
}

/**
 * Entitlement efektif:
 * - Jika user adalah OWNER di mana-mana team dan subscription OWNER tak active
 *   → potong semua entitlement owner (tak boleh create/invite; maxTeams=0).
 * - Untuk member, biar entitlement UI pasif (server still enforce).
 */
export function getEffectiveSalestrackEnt({ user, sub, isOwnerSomewhere }) {
  const raw = getRawSalestrackEnt(user, sub);
  const status = normalizeStatus(sub?.status);

  if (isOwnerSomewhere && !isSubActiveForOwner(status)) {
    return {
      ...raw,
      maxTeams: 0,
      canInvite: false,
      canCreateTeam: false,
      blockedReason: 'OWNER_SUB_INACTIVE',
    };
  }
  return raw;
}

// ... (semua util sedia ada: daysUntil/hasFeature/toolStatus/normalizeStatus/
//     isSubActiveForOwner/baseEntitlementsFromPlan/getRawSalestrackEnt/
//     getEffectiveSalestrackEnt) ...

/**
 * Registry entitlement mengikut tool slug.
 * - Tambah entry baru bila tool lain (cth: 'hrotg') perlukan logik khas.
 */
const ENTITLEMENT_STRATEGIES = {
  // salestrack → guna helper khusus yang dah ada
  salestrack: ({ user, sub, isOwnerSomewhere }) =>
    getEffectiveSalestrackEnt({ user, sub, isOwnerSomewhere }),

  // contoh kalau nak tambah tool lain nanti:
  // hrotg: ({ user, sub, isOwnerSomewhere }) => ({ planTier:'team', maxTeams:1, canInvite:false, canCreateTeam:true }),
};

/**
 * Dapatkan entitlement efektif untuk mana-mana tool.
 * Jika tiada strategy tool itu, pulangkan `null` (UI boleh treat sebagai tiada entitlement khas).
 */
export function getEffectiveEntitlementsForTool(toolSlug, { user, sub, isOwnerSomewhere }) {
  const fn = ENTITLEMENT_STRATEGIES[(toolSlug || '').toLowerCase()];
  if (!fn) return null;
  return fn({ user, sub, isOwnerSomewhere });
}

