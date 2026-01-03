import { useCallback, useEffect, useState } from "react";
import { http } from "../api/http"; // ✅ 토큰 재발급 포함된 http.ts 사용

export type CommunityStats = {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  withdrawnUsers: number;
  totalBoards: number;
  todayBoards: number;
  totalComments: number;
  todayComments: number;
};

type Status = "idle" | "loading" | "success" | "error";

function StatRow({ label, value }: { label: string; value?: number | null }) {
  const safe = typeof value === "number" ? value : 0;

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary">{safe.toLocaleString()}</span>
    </div>
  );
}

const EMPTY_STATS: CommunityStats = {
  totalUsers: 0,
  activeUsers: 0,
  bannedUsers: 0,
  withdrawnUsers: 0,
  totalBoards: 0,
  todayBoards: 0,
  totalComments: 0,
  todayComments: 0,
};

export function CommunityStatsCard() {
  const [status, setStatus] = useState<Status>("idle");
  const [stats, setStats] = useState<CommunityStats | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus("loading");

      const data = await http<Partial<CommunityStats>>("/api/community", {
        method: "GET",
      });

      const normalized: CommunityStats = {
        ...EMPTY_STATS,
        ...(data ?? {}),
      };

      setStats(normalized);
      setStatus("success");
    } catch (e) {
      console.error(e);
      setStats(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-lg border border-border p-6">
      <h4 className="mb-4 text-foreground">커뮤니티 현황</h4>

      {status === "loading" && (
        <div className="space-y-3">
          <div className="text-muted-foreground">불러오는 중...</div>
          <div className="h-4 rounded bg-secondary/60 animate-pulse" />
          <div className="h-4 rounded bg-secondary/60 animate-pulse" />
          <div className="h-4 rounded bg-secondary/60 animate-pulse" />
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <div className="text-muted-foreground">현황을 불러오지 못했습니다</div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center justify-center rounded-md border border-border bg-white px-3 py-2 text-sm hover:bg-secondary/20"
          >
            재시도
          </button>
        </div>
      )}

      {status === "success" && stats && (
        <div className="space-y-3">
          <StatRow label="활성 회원" value={stats.activeUsers} />
          <StatRow label="전체 게시글" value={stats.totalBoards} />
          <StatRow label="오늘 작성글" value={stats.todayBoards} />
        </div>
      )}
    </div>
  );
}
