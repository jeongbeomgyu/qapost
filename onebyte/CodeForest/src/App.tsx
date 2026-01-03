import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ChatDrawerProvider } from "./contexts/ChatDrawerContext";
import { useChatDrawer } from "./contexts/ChatDrawerContext";
import { ChatDrawer } from "./components/chat/ChatDrawer";

import { HomePage } from "./pages/HomePage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { CategoryPage } from "./pages/CategoryPage";
import { BoardsPage } from "./pages/BoardsPage";
import { WritePostPage } from "./pages/WritePostPage";
import { PostWritePage } from "./pages/PostWrite";
import { MyProfilePage } from "./pages/mypage/MyProfilePage";
import { MyPostsPage } from "./pages/mypage/MyPostsPage";
import { MyCommentsPage } from "./pages/mypage/MyCommentsPage";

import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { ChatRoomsPage } from "./pages/ChatRoomsPage";
import { ChatRoomPage } from "./pages/ChatRoomPage";

import { ProtectedRoute } from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <ChatDrawerProvider>
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
          {/* ✅ 대카 전체보기/소카 query 기반 목록 */}
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          {/* ✅ 소카테고리(=subCategoryId) 게시글 목록 */}
          <Route path="/category/:id" element={<CategoryPage />} />
          {/* ✅ 글쓰기/수정 */}
          <Route
            path="/post/write"
            element={
              <ProtectedRoute>
                <PostWritePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:id/edit"
            element={
              <ProtectedRoute>
                <PostWritePage />
              </ProtectedRoute>
            }
          />
          {/* ✅ 구버전 링크 호환 */}
          <Route path="/write" element={<Navigate to="/post/write" replace />} />

          {/* ✅ 채팅 (로그인 필요) */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatRoomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/room/:roomId"
            element={
              <ProtectedRoute>
                <ChatRoomPage />
              </ProtectedRoute>
            }
          />

          <Route path="/mypage" element={<Navigate to="/mypage/profile" replace />} />
          <Route path="/mypage/profile" element={<MyProfilePage />} />
          <Route path="/mypage/posts" element={<MyPostsPage />} />
          <Route path="/mypage/comments" element={<MyCommentsPage />} />

          {/* ✅ 없는 주소 처리(선택) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatDrawerMount />
        <Toaster />
      </Router>
    </ChatDrawerProvider>
  );
}

function ChatDrawerMount() {
  const { isOpen, close } = useChatDrawer();
  return <ChatDrawer isOpen={isOpen} onClose={close} />;
}
