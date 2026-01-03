import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  banAdminUser,
  fetchAdminUsers,
  unbanAdminUser,
  type AdminUser,
  type AdminUserStatusParam,
} from "../../api/AdminUserApi";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

type FilterType = "all" | "active" | "blocked" | "withdrawn";

type UiUserStatus = "active" | "blocked" | "withdrawn";
type UiUser = {
  id: string;
  email: string;
  nickname: string;
  status: UiUserStatus;
  joinedDate: string;
};

function mapApiUserToUi(user: AdminUser): UiUser {
  const raw = String((user as any).status ?? "").toUpperCase();

  const status: UiUserStatus =
    raw === "WITHDRAWN_BY_USER"
      ? "withdrawn"
      : raw === "BANNED_BY_ADMIN"
        ? "blocked"
        : "active";

  return {
    id: String(user.id),
    email: user.email,
    nickname: user.nickname,
    status,
    joinedDate: String((user as any).joinedDate ?? (user as any).createdAt ?? ""),
  };
}

function toStatusParam(filter: FilterType): AdminUserStatusParam {
  if (filter === "active") return "ACTIVE";
  if (filter === "blocked") return "BANNED";
  if (filter === "withdrawn") return "WITHDRAWN";
  return "ALL";
}

export function UserManagementSection() {
  const { isLoggedIn, role } = useAuth();
  const isAdmin = role === "ROLE_ADMIN";

  const [users, setUsers] = useState<UiUser[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(false);

  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    blocked: 0,
    withdrawn: 0,
  });

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UiUser | null>(null);
  const [banReason, setBanReason] = useState("");

  const [unbanConfirmOpen, setUnbanConfirmOpen] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState<UiUser | null>(null);

  const loadUsers = async (nextFilter: FilterType) => {
    try {
      setLoading(true);

      const list = await fetchAdminUsers(toStatusParam(nextFilter));
      const uiItems = (list ?? []).map(mapApiUserToUi);
      setUsers(uiItems);

      const [allList, activeList, bannedList, withdrawnList] = await Promise.all([
        fetchAdminUsers("ALL"),
        fetchAdminUsers("ACTIVE"),
        fetchAdminUsers("BANNED"),
        fetchAdminUsers("WITHDRAWN"),
      ]);

      setCounts({
        all: (allList ?? []).length,
        active: (activeList ?? []).length,
        blocked: (bannedList ?? []).length,
        withdrawn: (withdrawnList ?? []).length,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "회원 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ 로그인/관리자 아니면 호출 금지
    if (!isLoggedIn || !isAdmin) {
      setLoading(false);
      setUsers([]);
      return;
    }

    loadUsers(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isLoggedIn, isAdmin]);

  const filteredUsers = useMemo(() => users, [users]);

  const getStatusLabel = (status: UiUserStatus) => {
    const labels = { active: "활성", blocked: "차단", withdrawn: "탈퇴" };
    return labels[status];
  };

  const getStatusBadgeStyle = (status: UiUserStatus) => {
    const styles = {
      active: "bg-primary/10 text-primary border-primary/20",
      blocked: "bg-red-50 text-red-600 border-red-200",
      withdrawn: "bg-secondary text-muted-foreground border-border",
    };
    return styles[status];
  };

  const handleOpenBanModal = (user: UiUser) => {
    setSelectedUser(user);
    setBanReason("");
    setBanModalOpen(true);
  };

  const handleCloseBanModal = () => {
    setBanModalOpen(false);
    setSelectedUser(null);
    setBanReason("");
  };

  const handleBanUser = async () => {
    if (!banReason.trim()) return toast.error("차단 사유를 입력해주세요");
    if (!selectedUser) return;

    try {
      await banAdminUser(Number(selectedUser.id), banReason.trim());
      toast.success(`${selectedUser.nickname} 회원을 차단했습니다`);
      handleCloseBanModal();
      await loadUsers(filter);
    } catch (e: any) {
      toast.error(e?.message ?? "차단 실패");
    }
  };

  const handleOpenUnbanConfirm = (user: UiUser) => {
    setUnbanTarget(user);
    setUnbanConfirmOpen(true);
  };

  const handleCloseUnbanConfirm = () => {
    setUnbanConfirmOpen(false);
    setUnbanTarget(null);
  };

  const handleConfirmUnban = async () => {
    if (!unbanTarget) return;

    try {
      await unbanAdminUser(Number(unbanTarget.id));
      toast.success(`${unbanTarget.nickname} 회원의 차단을 해제했습니다`);
      handleCloseUnbanConfirm();
      await loadUsers(filter);
    } catch (e: any) {
      toast.error(e?.message ?? "차단 해제 실패");
    }
  };

  // ✅ 로그인 안 했으면 안내
  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
        <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
        <Link to="/login" className="text-primary hover:underline">
          로그인 하러가기 →
        </Link>
      </div>
    );
  }

  // ✅ 관리자 아니면 안내
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
        <p className="text-muted-foreground">권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1200px]">
        <h2 className="mb-8">회원 관리</h2>

        <div className="flex gap-6 mb-8 border-b border-border">
          {[
            { key: "all" as FilterType, label: "전체" },
            { key: "active" as FilterType, label: "활성" },
            { key: "blocked" as FilterType, label: "차단" },
            { key: "withdrawn" as FilterType, label: "탈퇴" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`pb-4 border-b-2 transition-colors ${
                filter === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_200px_140px_150px_180px] gap-4 px-6 py-4 bg-muted/30 border-b border-border text-muted-foreground">
            <div>ID</div>
            <div>이메일</div>
            <div>닉네임</div>
            <div>상태</div>
            <div>가입일</div>
            <div className="text-center">작업</div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-muted-foreground">불러오는 중...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">회원이 없습니다</div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[100px_1fr_200px_140px_150px_180px] gap-4 px-6 py-5 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors items-center"
              >
                <div className="text-muted-foreground">{user.id}</div>
                <div className="text-foreground truncate">{user.email}</div>
                <div className="text-foreground">{user.nickname}</div>
                <div>
                  <span className={`inline-block px-3 py-1 rounded border text-sm ${getStatusBadgeStyle(user.status)}`}>
                    {getStatusLabel(user.status)}
                  </span>
                </div>
                <div className="text-muted-foreground">{user.joinedDate}</div>
                <div className="flex items-center justify-center gap-2">
                  {user.status === "active" && (
                    <button
                      onClick={() => handleOpenBanModal(user)}
                      className="px-4 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      차단
                    </button>
                  )}
                  {user.status === "blocked" && (
                    <button
                      onClick={() => handleOpenUnbanConfirm(user)}
                      className="px-4 py-1.5 border border-primary text-primary rounded hover:bg-primary/5 transition-colors"
                    >
                      차단 해제
                    </button>
                  )}
                  {user.status === "withdrawn" && <span className="text-sm text-muted-foreground">관리 불가</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ban Modal */}
      {banModalOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={handleCloseBanModal} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-foreground">회원 차단</h3>
              <button onClick={handleCloseBanModal} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">{selectedUser.nickname}</span> 회원을 차단하시겠습니까?
                </p>
                <p className="text-xs text-red-600 mt-1">차단된 회원은 로그인 및 활동이 제한됩니다.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  차단 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="차단 사유를 입력해주세요..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={handleCloseBanModal}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleBanUser}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                차단하기
              </button>
            </div>
          </div>
        </>
      )}

      {/* Unban Confirm Modal */}
      {unbanConfirmOpen && unbanTarget && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={handleCloseUnbanConfirm} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-foreground">차단 해제</h3>
              <button onClick={handleCloseUnbanConfirm} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{unbanTarget.nickname}</span> 회원의 차단을 해제하시겠습니까?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={handleCloseUnbanConfirm}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmUnban}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                해제하기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
