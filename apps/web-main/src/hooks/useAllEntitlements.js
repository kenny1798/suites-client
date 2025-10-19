// hooks/useAllEntitlements.js
import * as React from "react";
import { billingApi } from "@suite/api-clients";

export function useAllEntitlements() {
  const [s, set] = React.useState({ loading: true, error: "", items: [] });
  React.useEffect(() => {
    let on = true;
    billingApi.getEntitlements()
      .then((arr) => on && set({ loading: false, error: "", items: Array.isArray(arr) ? arr : [] }))
      .catch((e) => on && set({ loading: false, error: e?.response?.data?.error || "FAILED", items: [] }));
    return () => { on = false; };
  }, []);
  return s;
}
