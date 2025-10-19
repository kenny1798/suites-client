// apps/web-main/src/lib/billing-utils.js
export function summarizeToolStatus(ent) {
    if (!ent) return { state: "none" }; // tiada langganan/tiada trial
    const s = ent.status;
    if (s === "trialing") return { state: "trial", trialEnd: ent.trialEnd };
    if (s === "active")   return { state: "active", currentPeriodEnd: ent.currentPeriodEnd };
    if (s === "past_due") return { state: "past_due" };
    if (s === "canceled" || s === "expired") return { state: "expired" };
    return { state: "none" };
  }
  
  export const formatMYR = (cents) => `RM${(Number(cents || 0) / 100).toFixed(2)}`;
  