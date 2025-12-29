import { useState } from "react";
import client from "../api/client";
import JsonView from "./JsonView";

export default function BoardPanel() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const [queryBoardId, setQueryBoardId] = useState("");
  const [updateBoardId, setUpdateBoardId] = useState("");

  const [createReq, setCreateReq] = useState({
    categoryId: 1,
    title: "",
    content: "",
  });

  const [updateReq, setUpdateReq] = useState({
    categoryId: 1,
    title: "",
    content: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const getStoredToken = () => localStorage.getItem("token"); // ✅ AuthPanel이 저장하는 키

  const run = async (fn) => {
    setError(null);
    setResult(null);

    try {
      // 디버깅: 지금 토큰이 실제로 있는지
      const t = getStoredToken();
      console.log("[BoardPanel] token exists?", !!t);

      const res = await fn();
      setResult(res.data);
    } catch (e) {
      setError({
        message: e?.message,
        status: e?.response?.status,
        data: e?.response?.data,
        url: (e?.config?.baseURL ?? "") + (e?.config?.url ?? ""),
        method: e?.config?.method,
        requestHeaders: {
          authorization: e?.config?.headers?.Authorization || e?.config?.headers?.authorization,
        },
      });
    }
  };

  // ✅ baseURL이 http://localhost:8080/api 라고 가정하면
  // ✅ 여기서는 /boards 로만 호출해야 함
  const listBoards = () => run(() => client.get(`/boards?page=${page}&size=${size}`));
  const getBoard = () => run(() => client.get(`/boards/${queryBoardId}`));
  const deleteBoard = () => run(() => client.delete(`/boards/${queryBoardId}`));
  const createBoard = () =>
    run(() => {
      if (!getStoredToken()) {
        throw new Error("토큰이 없습니다. 로그인 후 Save token까지 했는지 확인하세요.");
      }
      return client.post(`/boards`, createReq);
    });

  const updateBoard = () =>
    run(() => {
      if (!getStoredToken()) {
        throw new Error("토큰이 없습니다. 로그인 후 Save token까지 했는지 확인하세요.");
      }
      return client.put(`/boards/${updateBoardId}`, updateReq);
    });

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginTop: 12 }}>
      <h2 style={{ marginTop: 0 }}>Boards</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={listBoards}>GET /boards</button>
        <label>
          page{" "}
          <input value={page} onChange={(e) => setPage(Number(e.target.value))} style={{ width: 60 }} />
        </label>
        <label>
          size{" "}
          <input value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: 60 }} />
        </label>
      </div>

      <hr />

      {/* GET / DELETE */}
      <div style={{ display: "grid", gap: 8, maxWidth: 800 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="boardId (GET/DELETE)"
            value={queryBoardId}
            onChange={(e) => setQueryBoardId(e.target.value)}
            style={{ width: 180, padding: 6 }}
          />
          <button onClick={getBoard} disabled={!queryBoardId}>
            GET /boards/{`{id}`}
          </button>
          <button onClick={deleteBoard} disabled={!queryBoardId}>
            DELETE /boards/{`{id}`}
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* CREATE */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Create (로그인 필요)</h3>
            <input
              placeholder="categoryId"
              value={createReq.categoryId}
              onChange={(e) => setCreateReq((p) => ({ ...p, categoryId: Number(e.target.value) }))}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <input
              placeholder="title"
              value={createReq.title}
              onChange={(e) => setCreateReq((p) => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <textarea
              placeholder="content"
              value={createReq.content}
              onChange={(e) => setCreateReq((p) => ({ ...p, content: e.target.value }))}
              style={{ width: "100%", padding: 8, marginBottom: 8, minHeight: 80 }}
            />
            <button onClick={createBoard}>POST /boards</button>
          </div>

          {/* UPDATE */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <h3>Update (작성자만)</h3>
            <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
              updateBoardId 넣고 Update 누르면 됨
            </div>

            <input
              placeholder="update boardId"
              value={updateBoardId}
              onChange={(e) => setUpdateBoardId(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />

            <input
              placeholder="categoryId"
              value={updateReq.categoryId}
              onChange={(e) => setUpdateReq((p) => ({ ...p, categoryId: Number(e.target.value) }))}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <input
              placeholder="title"
              value={updateReq.title}
              onChange={(e) => setUpdateReq((p) => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", padding: 8, marginBottom: 8 }}
            />
            <textarea
              placeholder="content"
              value={updateReq.content}
              onChange={(e) => setUpdateReq((p) => ({ ...p, content: e.target.value }))}
              style={{ width: "100%", padding: 8, marginBottom: 8, minHeight: 80 }}
            />

            <button onClick={updateBoard} disabled={!updateBoardId}>
              PUT /boards/{`{id}`}
            </button>
          </div>
        </div>
      </div>

      <JsonView title="Result" data={result} />
      <JsonView title="Error" data={error} />
    </div>
  );
}
