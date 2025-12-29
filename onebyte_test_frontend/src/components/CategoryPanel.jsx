import { useState } from "react";
import client from "../api/client";
import JsonView from "./JsonView";

export default function CategoryPanel() {
  const [categoryId, setCategoryId] = useState("");

  // Create/Update payload (프로젝트 DTO에 맞게 name만 둠)
  const [createReq, setCreateReq] = useState({ name: "" });
  const [updateReq, setUpdateReq] = useState({ name: "" });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
        requestHeaders: e?.config?.headers, // Authorization 붙었는지 확인용
      });
    }
  };

  const id = categoryId.trim();

  // ✅ Category API
  const list = () => run(() => client.get(`/categories`));
  const create = () => run(() => client.post(`/categories`, createReq)); // 관리자
  const update = () => run(() => client.put(`/categories/${id}`, updateReq)); // 관리자
  const remove = () => run(() => client.delete(`/categories/${id}`)); // 관리자

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <h2 style={{ marginTop: 0 }}>Categories</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={list}>GET /api/categories</button>
      </div>

      <hr />

      <div style={{ display: "grid", gap: 12, maxWidth: 900 }}>
        {/* Create */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Create (관리자)</h3>
            <input
              placeholder="name"
              value={createReq.name}
              onChange={(e) => setCreateReq({ name: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <button onClick={create} disabled={!createReq.name.trim()}>
              POST /api/categories
            </button>
          </div>

          {/* Update/Delete */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Update / Delete (관리자)</h3>

            <input
              placeholder="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <input
              placeholder="new name"
              value={updateReq.name}
              onChange={(e) => setUpdateReq({ name: e.target.value })}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={update} disabled={!id || !updateReq.name.trim()}>
                PUT /api/categories/{`{id}`}
              </button>
              <button onClick={remove} disabled={!id}>
                DELETE /api/categories/{`{id}`}
              </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              401 뜨면 관리자 권한(ROLE_ADMIN) 아니거나 Authorization 헤더 안 붙은 거.
            </div>
          </div>
        </div>
      </div>

      <JsonView title="Result" data={result} />
      <JsonView title="Error" data={error} />
    </div>
  );
}
