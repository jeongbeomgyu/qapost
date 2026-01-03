import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

function isCategoryActive(c) {
  // 백엔드에서 isActive로 내려오면 isActive,
  // boolean getter로 active로 내려오면 active
  return (c?.isActive ?? c?.active) === true;
}

function catLabel(c) {
  // name 우선, 없으면 code
  return c?.name || c?.code || `category-${c?.id}`;
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const [boards, setBoards] = useState([]);
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });

  const [page, setPage] = useState(0);
  const size = 20;

  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("all"); // title | content | all
  const [searchOn, setSearchOn] = useState(false);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [error, setError] = useState("");

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) || null,
    [categories, activeCategoryId]
  );

  // 카테고리 로딩
  useEffect(() => {
    (async () => {
      setError("");
      setLoadingCats(true);
      try {
        const data = await apiGet("/api/categories");
        const list = Array.isArray(data) ? data : data?.content ?? [];

        // 활성만 탭에 보여주기
        const actives = list.filter(isCategoryActive);

        setCategories(actives);
        if (actives.length > 0) setActiveCategoryId(actives[0].id);
      } catch (e) {
        setError(e.message || "카테고리 로딩 실패");
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  // 게시글 로딩
  useEffect(() => {
    if (!activeCategoryId) return;

    (async () => {
      setError("");
      setLoadingBoards(true);
      try {
        let data;

        if (searchOn && keyword.trim()) {
          const q = encodeURIComponent(keyword.trim());
          data = await apiGet(
            `/api/boards/search?categoryId=${activeCategoryId}&keyword=${q}&type=${type}&page=${page}&size=${size}`
          );
        } else {
          data = await apiGet(
            `/api/boards?categoryId=${activeCategoryId}&page=${page}&size=${size}`
          );
        }

        const list = Array.isArray(data) ? data : data?.content ?? [];
        setBoards(list);

        setPageInfo({
          totalPages: data?.totalPages ?? 0,
          totalElements: data?.totalElements ?? list.length,
        });
      } catch (e) {
        setError(e.message || "게시글 로딩 실패");
      } finally {
        setLoadingBoards(false);
      }
    })();
  }, [activeCategoryId, page, size, searchOn, keyword, type]);

  function onClickCategory(id) {
    setActiveCategoryId(id);
    setPage(0);
    // 카테고리 바꾸면 검색도 유지할지 말지 선택
    // 난 유지하는 게 UX 좋아서 유지하게 둠
  }

  function onSubmitSearch(e) {
    e.preventDefault();
    setSearchOn(true);
    setPage(0);
  }

  function clearSearch() {
    setKeyword("");
    setSearchOn(false);
    setPage(0);
  }

  return (
    <div style={{ fontFamily: "system-ui" }}>
      <header style={{ borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 12px" }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>ONEBYTE 게시판</div>

          <div style={{ marginTop: 12 }}>
            {loadingCats ? (
              <div>카테고리 불러오는 중...</div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {categories.map((c) => {
                  const active = c.id === activeCategoryId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onClickCategory(c.id)}
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px 12px",
                        borderRadius: 999,
                        cursor: "pointer",
                        background: active ? "#111" : "#fff",
                        color: active ? "#fff" : "#111",
                        fontWeight: active ? 800 : 600,
                      }}
                      title={c.code}
                    >
                      {catLabel(c)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmitSearch}
            style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid #ddd" }}
            >
              <option value="all">제목+내용</option>
              <option value="title">제목</option>
              <option value="content">내용</option>
            </select>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="카테고리 내 키워드 검색"
              style={{
                flex: 1,
                minWidth: 240,
                padding: "8px 10px",
                border: "1px solid #ddd",
              }}
            />

            <button
              type="submit"
              disabled={!activeCategoryId}
              style={{
                padding: "8px 14px",
                border: "1px solid #111",
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              검색
            </button>

            <button
              type="button"
              onClick={clearSearch}
              style={{
                padding: "8px 14px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              초기화
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
              {error}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 12px" }}>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 10,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {activeCategory ? catLabel(activeCategory) : "게시글"}
              {searchOn && keyword.trim() ? (
                <span style={{ marginLeft: 8, color: "#666", fontWeight: 600 }}>
                  검색: “{keyword.trim()}” ({type})
                </span>
              ) : null}
            </div>
            <div style={{ color: "#666", fontSize: 12 }}>
              total: {pageInfo.totalElements}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {loadingBoards ? (
              <div>게시글 불러오는 중...</div>
            ) : boards.length === 0 ? (
              <div style={{ color: "#666" }}>게시글이 없습니다.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                    <th style={{ padding: "10px 8px", width: 80 }}>ID</th>
                    <th style={{ padding: "10px 8px" }}>제목</th>
                  </tr>
                </thead>
                <tbody>
                  {boards.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                      <td style={{ padding: "10px 8px", color: "#666" }}>{b.id}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>
                        {b.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: page === 0 ? "not-allowed" : "pointer",
              }}
            >
              이전
            </button>
            <div style={{ alignSelf: "center", color: "#666" }}>
              page: {page} / {Math.max(0, (pageInfo.totalPages || 1) - 1)}
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pageInfo.totalPages ? page + 1 >= pageInfo.totalPages : false}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor:
                  pageInfo.totalPages && page + 1 >= pageInfo.totalPages
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              다음
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
