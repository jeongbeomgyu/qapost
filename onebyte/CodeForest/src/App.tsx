import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ChatProvider } from "./contexts/ChatContext";
import { UnifiedChatPanel } from "./components/UnifiedChatPanel";
import { Toaster } from "./components/ui/sonner";

import { HomePage } from "./pages/HomePage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { CategoryPage } from "./pages/CategoryPage";
import { WritePostPage } from "./pages/WritePostPage";
import { PostWritePage } from "./pages/PostWrite";
import { MyProfilePage } from "./pages/mypage/MyProfilePage";
import { MyPostsPage } from "./pages/mypage/MyPostsPage";
import { MyCommentsPage } from "./pages/mypage/MyCommentsPage";

import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";

import { ProtectedRoute } from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <ChatProvider>
      <Router>
        <Routes>
          {/* ✅ 로그인 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ✅ 관리자 전체 보호 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/admin/categories" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          {/* 일반 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          {/* ✅ 소카테고리(=subCategoryId) 게시글 목록 */}
          <Route path="/category/:id" element={<CategoryPage />} />
          {/* ✅ 글쓰기/수정 */}
          <Route path="/post/write" element={<PostWritePage />} />
          <Route path="/post/:id/edit" element={<PostWritePage />} />
          {/* ✅ 구버전 링크 호환 */}
          <Route path="/write" element={<Navigate to="/post/write" replace />} />

          <Route path="/mypage" element={<Navigate to="/mypage/profile" replace />} />
          <Route path="/mypage/profile" element={<MyProfilePage />} />
          <Route path="/mypage/posts" element={<MyPostsPage />} />
          <Route path="/mypage/comments" element={<MyCommentsPage />} />

          {/* ✅ 없는 주소 처리(선택) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <UnifiedChatPanel />
        <Toaster />
      </Router>
    </ChatProvider>
  );
}
