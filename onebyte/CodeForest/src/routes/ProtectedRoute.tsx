import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken } from "../api/AuthApi";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
  /** 관리자 페이지면 true (role 확인 가능할 때만 제한, 아니면 토큰 존재만 체크) */
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const token = getAccessToken();
  const { role } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  // role을 파싱할 수 있는 경우에만 관리자 체크
  if (requireAdmin && role && role !== "ROLE_ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
