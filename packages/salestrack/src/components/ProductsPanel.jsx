import React from "react";
import { toolsApi } from "@suite/api-clients";

function centsToMoney(c) {
  return (Number(c || 0) / 100).toFixed(2);
}
function moneyToCents(v) {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export default function ProductsPanel({ teamId }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // form tambah
  const [form, setForm] = React.useState({
    name: "",
    price: "",
    category: "",
    description: "",
  });

  // tab penapis: 'all' | 'active' | 'inactive'
  const [tab, setTab] = React.useState("active");

  // edit state
  const [editing, setEditing] = React.useState({}); // { [id]: true }
  const [drafts, setDrafts] = React.useState({}); // { [id]: {name, price, category, description} }

  const load = async () => {
    if (!teamId) return;
    setLoading(true);
    setErr("");
    try {
      const qs =
        tab === "active" ? "?active=1" : tab === "inactive" ? "?active=0" : "";
      const res = await toolsApi.get(
        `/api/salestrack/teams/${teamId}/products${qs}`,
        { timeout: 15000 }
      );
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, tab]);

  // --------- CRUD handlers ----------
  const add = async () => {
    setSaving(true);
    setErr("");
    try {
      await toolsApi.post(
        `/api/salestrack/teams/${teamId}/products`,
        {
          name: form.name.trim(),
          price: form.price, // backend terima price atau priceCents; controller convert
          category: form.category || null,
          description: form.description || null,
          isActive: true,
        },
        { timeout: 15000 }
      );
      setForm({ name: "", price: "", category: "", description: "" });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditing((s) => ({ ...s, [p.id]: true }));
    setDrafts((d) => ({
      ...d,
      [p.id]: {
        name: p.name,
        price: centsToMoney(p.priceCents),
        category: p.category || "",
        description: p.description || "",
      },
    }));
  };

  const cancelEdit = (id) => {
    setEditing((s) => {
      const { [id]: _, ...rest } = s;
      return rest;
    });
    setDrafts((d) => {
      const { [id]: _, ...rest } = d;
      return rest;
    });
  };

  const saveEdit = async (id) => {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(true);
    setErr("");
    try {
      await toolsApi.put(
        `/api/salestrack/teams/${teamId}/products/${id}`,
        {
          name: draft.name.trim(),
          price: draft.price,
          category: draft.category || null,
          description: draft.description || null,
        },
        { timeout: 15000 }
      );
      cancelEdit(id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    setSaving(true);
    setErr("");
    try {
      if (p.isActive) {
        await toolsApi.delete(
          `/api/salestrack/teams/${teamId}/products/${p.id}`
        );
      } else {
        await toolsApi.post(
          `/api/salestrack/teams/${teamId}/products/${p.id}/restore`
        );
      }
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update product status.");
    } finally {
      setSaving(false);
    }
  };

  // --------- UI ----------
  return (
    <section className="rounded-md border p-6 bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
      </div>
      <p className="text-slate-500 text-sm mt-1">
        Tambah & urus produk untuk digunakan masa create contact / deal.
      </p>

      {/* Tabs filter */}
      <div className="mt-4 flex gap-2 border-b">
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "inactive", label: "Inactive" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === t.key
                ? "border-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add form (top) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Price (e.g. 99.00)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <button
          disabled={saving || !form.name.trim()}
          onClick={add}
          className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Product"}
        </button>
      </div>
      <textarea
        className="mt-3 w-full border rounded px-3 py-2"
        rows={2}
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded border p-4">Loading…</div>
        ) : items.length === 0 ? (
          <p className="text-slate-500">No products in this view.</p>
        ) : (
          <div className="divide-y border rounded">
            {items.map((p) => {
              const isEdit = !!editing[p.id];
              const d = drafts[p.id] || {};
              return (
                <div key={p.id} className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* Name */}
                    <div className="md:col-span-4">
                      {isEdit ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={d.name}
                          onChange={(e) =>
                            setDrafts((s) => ({
                              ...s,
                              [p.id]: { ...s[p.id], name: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div className="font-medium">{p.name}</div>
                      )}
                      <div className="text-xs text-slate-500">
                        #{p.id} • {p.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2">
                      {isEdit ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={d.price}
                          onChange={(e) =>
                            setDrafts((s) => ({
                              ...s,
                              [p.id]: { ...s[p.id], price: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div>{centsToMoney(p.priceCents)}</div>
                      )}
                    </div>

                    {/* Category */}
                    <div className="md:col-span-2">
                      {isEdit ? (
                        <input
                          className="w-full border rounded px-2 py-1"
                          value={d.category}
                          onChange={(e) =>
                            setDrafts((s) => ({
                              ...s,
                              [p.id]: { ...s[p.id], category: e.target.value },
                            }))
                          }
                        />
                      ) : (
                        <div className="text-slate-700">
                          {p.category || "-"}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-4 flex justify-end gap-2">
                      {isEdit ? (
                        <>
                          <button
                            className="px-3 py-1 rounded border"
                            onClick={() => cancelEdit(p.id)}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-slate-900 text-white"
                            onClick={() => saveEdit(p.id)}
                            disabled={saving || !d.name?.trim()}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-3 py-1 rounded border"
                            onClick={() => startEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className={`px-3 py-1 rounded border ${
                              p.isActive ? "text-red-600" : "text-green-700"
                            }`}
                            onClick={() => toggleActive(p)}
                          >
                            {p.isActive ? "Deactivate" : "Restore"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description row */}
                  <div className="mt-2">
                    {isEdit ? (
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        rows={2}
                        value={d.description}
                        onChange={(e) =>
                          setDrafts((s) => ({
                            ...s,
                            [p.id]: {
                              ...s[p.id],
                              description: e.target.value,
                            },
                          }))
                        }
                        placeholder="Description"
                      />
                    ) : p.description ? (
                      <div className="text-slate-600 text-sm">
                        {p.description}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </section>
  );
}
