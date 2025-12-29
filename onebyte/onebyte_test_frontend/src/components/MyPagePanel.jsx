import { useState } from "react";
import client from "../api/client";
import JsonView from "./JsonView";

export default function MyPagePanel() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingKey, setLoadingKey] = useState("");

  // PATCH /api/mypage/info
  const [infoPatch, setInfoPatch] = useState({
    name: "",
    nickname: "",
  });

  // PATCH /api/mypage/password
  const [pwPatch, setPwPatch] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // paging (필요하면 너희 백엔드 파라미터 맞춰서 바꿔)
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const run = async (key, fn) => {
    setLoadingKey(key);
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
        request: {
          method: e?.config?.method,
          url: e?.config?.url,
          baseURL: e?.config?.baseURL,
          params: e?.config?.params,
        },
      });
    } finally {
      setLoadingKey("");
    }
  };

  // ✅ API들
  const getInfo = () => run("getInfo", () => client.get("/mypage/info"));
  const patchInfo = () =>
    run("patchInfo", () => client.patch("/mypage/info", infoPatch));

  const patchPassword = () => {
    if (pwPatch.newPassword !== pwPatch.confirmNewPassword) {
      setError({ message: "새 비밀번호 확인이랑 newPassword가 달라" });
      return;
    }
    return run("patchPassword", () =>
      client.patch("/mypage/password", {
        currentPassword: pwPatch.currentPassword,
        newPassword: pwPatch.newPassword,
      })
    );
  };

  const withdraw = () =>
    run("withdraw", () => client.delete("/mypage/withdraw"));

  const getMyBoards = () =>
    run("getMyBoards", () =>
      client.get("/mypage/boards", { params: { page, size } })
    );

  const getMyComments = () =>
    run("getMyComments", () =>
      client.get("/mypage/comments", { params: { page, size } })
    );

  const loading = (k) => loadingKey === k;

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>MyPage</h2>

      {/* Quick Buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={getInfo} disabled={loadingKey}>
          {loading("getInfo") ? "..." : "GET /api/mypage/info"}
        </button>

        <button onClick={getMyBoards} disabled={loadingKey}>
          {loading("getMyBoards") ? "..." : "GET /api/mypage/boards"}
        </button>

        <button onClick={getMyComments} disabled={loadingKey}>
          {loading("getMyComments") ? "..." : "GET /api/mypage/comments"}
        </button>

        <button onClick={withdraw} disabled={loadingKey}>
          {loading("withdraw") ? "..." : "DELETE /api/mypage/withdraw"}
        </button>
      </div>

      {/* paging */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700 }}>Paging</div>
        <label>
          page{" "}
          <input
            style={{ width: 80, padding: 6 }}
            type="number"
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
          />
        </label>
        <label>
          size{" "}
          <input
            style={{ width: 80, padding: 6 }}
            type="number"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* PATCH info */}
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <h3 style={{ margin: 0 }}>PATCH /api/mypage/info</h3>
        <input
          style={{ width: "100%", padding: 8 }}
          placeholder="name"
          value={infoPatch.name}
          onChange={(e) => setInfoPatch((p) => ({ ...p, name: e.target.value }))}
        />
        <input
          style={{ width: "100%", padding: 8 }}
          placeholder="nickname"
          value={infoPatch.nickname}
          onChange={(e) =>
            setInfoPatch((p) => ({ ...p, nickname: e.target.value }))
          }
        />
        <button onClick={patchInfo} disabled={loadingKey}>
          {loading("patchInfo") ? "..." : "PATCH /api/mypage/info"}
        </button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* PATCH password */}
      <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <h3 style={{ margin: 0 }}>PATCH /api/mypage/password</h3>
        <input
          style={{ width: "100%", padding: 8 }}
          placeholder="currentPassword"
          type="password"
          value={pwPatch.currentPassword}
          onChange={(e) =>
            setPwPatch((p) => ({ ...p, currentPassword: e.target.value }))
          }
        />
        <input
          style={{ width: "100%", padding: 8 }}
          placeholder="newPassword"
          type="password"
          value={pwPatch.newPassword}
          onChange={(e) =>
            setPwPatch((p) => ({ ...p, newPassword: e.target.value }))
          }
        />
        <input
          style={{ width: "100%", padding: 8 }}
          placeholder="confirmNewPassword"
          type="password"
          value={pwPatch.confirmNewPassword}
          onChange={(e) =>
            setPwPatch((p) => ({ ...p, confirmNewPassword: e.target.value }))
          }
        />
        <button onClick={patchPassword} disabled={loadingKey}>
          {loading("patchPassword") ? "..." : "PATCH /api/mypage/password"}
        </button>
      </div>

      <JsonView title="Result" data={result} />
      <JsonView title="Error" data={error} />
    </div>
  );
}
