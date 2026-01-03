import { useEffect, useMemo, useState } from "react";
import { Mail, Globe, Edit2, Save, X, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  changeMyPassword,
  fetchMyPageInfo,
  updateMyPageInfo,
  withdrawMe,
  type MyPageInfo,
} from "../../api/MyPageApi";
import { clearAccessToken } from "../../api/AuthApi";
import { useAuth } from "../../contexts/AuthContext";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export function ProfileSection() {
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [me, setMe] = useState<MyPageInfo | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    bio: "",
    websiteUrl: "",
    createdAt: "",
  });

  const joinedDateText = useMemo(() => formatDate(formData.createdAt), [formData.createdAt]);

  const syncFormFromMe = (user: MyPageInfo) => {
    setFormData({
      name: user.name ?? "",
      nickname: user.nickname ?? "",
      email: user.email ?? "",
      bio: user.bio ?? "",
      websiteUrl: user.websiteUrl ?? "",
      createdAt: user.createdAt ?? "",
    });
  };

  const loadMe = async () => {
    const data = await fetchMyPageInfo();
    setMe(data);
    syncFormFromMe(data);
  };

  useEffect(() => {
    // ✅ 로그인 안 했으면 호출 금지
    if (!isLoggedIn) {
      setLoading(false);
      setMe(null);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        await loadMe();
      } catch (e: any) {
        // http.ts가 401 처리(재발급/리다이렉트)까지 할 거라서
        // 여기서는 UI만 덜 깨지게 처리
        console.error(e);
        toast.error(e?.message ?? "내 정보 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  const handleSave = async () => {
    if (!me) return;

    const name = formData.name.trim();
    const nickname = formData.nickname.trim();

    if (!name || !nickname) {
      toast.error("이름/닉네임을 입력해주세요");
      return;
    }

    try {
      await updateMyPageInfo({
        name,
        nickname,
        bio: formData.bio ?? "",
        websiteUrl: formData.websiteUrl ?? "",
      });
      toast.success("프로필이 저장되었습니다");

      await loadMe();
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "프로필 저장 실패");
    }
  };

  const handleCancel = () => {
    if (me) syncFormFromMe(me);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호가 일치하지 않습니다");
      return;
    }

    try {
      await changeMyPassword({ currentPassword, newPassword });
      toast.success("비밀번호가 변경되었습니다");
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast.error(e?.message ?? "비밀번호 변경 실패");
    }
  };

  const handleWithdraw = async () => {
    try {
      await withdrawMe();
      toast.success("회원 탈퇴가 완료되었습니다");

      clearAccessToken();
      window.location.assign("/");
    } catch (e: any) {
      toast.error(e?.message ?? "회원 탈퇴 실패");
    } finally {
      setShowWithdrawModal(false);
    }
  };

  // ✅ 로그인 안 했으면 마이페이지 섹션 자체를 보여주지 않거나, 안내 띄우기
  if (!isLoggedIn) {
    return <div className="p-6 text-muted-foreground">로그인이 필요합니다.</div>;
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">불러오는 중...</div>;
  }

  if (!me) {
    return <div className="p-6 text-muted-foreground">내 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">회원정보</h1>
          <p className="text-muted-foreground">프로필 정보를 관리하고 수정할 수 있습니다</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            수정하기
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              저장하기
            </button>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">이름</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <div className="px-4 py-2.5 bg-secondary/30 rounded-lg text-foreground">{formData.name}</div>
            )}
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">닉네임</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <div className="px-4 py-2.5 bg-secondary/30 rounded-lg text-foreground">{formData.nickname}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              이메일
            </label>
            <div className="px-4 py-2.5 bg-secondary/30 rounded-lg text-muted-foreground">
              {formData.email}
              <span className="ml-2 text-xs text-primary">(변경 불가)</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">자기소개</label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="자신을 소개해주세요..."
              />
            ) : (
              <div className="px-4 py-2.5 bg-secondary/30 rounded-lg text-foreground min-h-[100px]">
                {formData.bio || <span className="text-muted-foreground">자기소개가 없습니다</span>}
              </div>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              웹사이트
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="https://example.com"
              />
            ) : (
              <div className="px-4 py-2.5 bg-secondary/30 rounded-lg">
                {formData.websiteUrl ? (
                  <a
                    href={formData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {formData.websiteUrl}
                  </a>
                ) : (
                  <span className="text-muted-foreground">웹사이트가 없습니다</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="p-8">
          <h3 className="mb-6">계정 설정</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors text-foreground border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div>비밀번호 변경</div>
                  <div className="text-xs text-muted-foreground mt-0.5">보안을 위해 주기적으로 변경하세요</div>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">›</span>
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600 border border-red-200 hover:border-red-300"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <div className="text-left">
                  <div>회원 탈퇴</div>
                  <div className="text-xs text-red-500 mt-0.5">탈퇴 시 모든 데이터가 삭제됩니다</div>
                </div>
              </div>
              <span className="text-sm">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                비밀번호 변경
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">현재 비밀번호</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="현재 비밀번호를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">새 비밀번호</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="새 비밀번호를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="새 비밀번호를 다시 입력하세요"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                변경하기
              </button>
            </div>
          </div>
        </>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowWithdrawModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                회원 탈퇴
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                <p className="text-red-800 mb-2">회원 탈퇴 시 모든 정보는 복구할 수 없습니다.</p>
                <p className="text-red-800">정말 탈퇴하시겠습니까?</p>
                <p className="text-xs text-red-600 mt-3">탈퇴 후 복구가 불가능합니다.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
