import { useState } from "react";
import client from "../api/client";
import JsonView from "./JsonView";

export default function CategoryPanel() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [createReq, setCreateReq] = useState({ code: "", name: "", isActive: true });
  const [categoryId, setCategoryId] = useState("");
  const [updateReq, setUpdateReq] = useState({ code: "", name: "", isActive: true });

  const run = async (fn) => {
    setError(null);
    setResult(null);
    try {
      const res = await fn();
      setResult(res.data);
    } catch (e) {
      setError({
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        url: (e?.config?.baseURL ?? "") + (e?.config?.url ?? ""),
        method: e?.config?.method,
      });
    }
  };

  const list = () => run(() => client.get(`/categories`));
  const create = () => run(() => client.post(`/categories`, createReq));
  const update = () => run(() => client.put(`/categories/${categoryId}`, updateReq));
  const remove = () => run(() => client.delete(`/categories/${categoryId}`));

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <h2 style={{ marginTop: 0 }}>Categories</h2>

      <button onClick={list}>GET /api/categories</button>

      <hr />

      <h3 style={{ marginTop: 0 }}>Create / Update / Delete (관리자)</h3>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* CREATE */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h4>Create</h4>

          <input
            placeholder="code (필수)"
            value={createReq.code}
            onChange={(e) => setCreateReq((p) => ({ ...p, code: e.target.value }))}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="name (필수)"
            value={createReq.name}
            onChange={(e) => setCreateReq((p) => ({ ...p, name: e.target.value }))}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={!!createReq.isActive}
              onChange={(e) => setCreateReq((p) => ({ ...p, isActive: e.target.checked }))}
            />
            isActive
          </label>

          <button onClick={create} disabled={!createReq.code.trim() || !createReq.name.trim()}>
            POST /api/categories
          </button>
        </div>

        {/* UPDATE / DELETE */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h4>Update / Delete</h4>

          <input
            placeholder="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />

          <input
            placeholder="new code (필수)"
            value={updateReq.code}
            onChange={(e) => setUpdateReq((p) => ({ ...p, code: e.target.value }))}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <input
            placeholder="new name (필수)"
            value={updateReq.name}
            onChange={(e) => setUpdateReq((p) => ({ ...p, name: e.target.value }))}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />

          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={!!updateReq.isActive}
              onChange={(e) => setUpdateReq((p) => ({ ...p, isActive: e.target.checked }))}
            />
            isActive
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={update}
              disabled={!categoryId || !updateReq.code.trim() || !updateReq.name.trim()}
            >
              PUT /api/categories/{`{id}`}
            </button>

            <button onClick={remove} disabled={!categoryId}>
              DELETE /api/categories/{`{id}`}
            </button>
          </div>
        </div>
      </div>

      <JsonView title="Result" data={result} />
      <JsonView title="Error" data={error} />
    </div>
  );
}
