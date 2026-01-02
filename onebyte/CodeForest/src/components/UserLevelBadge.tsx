import { getUserLevelInfo, type UserLevel } from '../utils/userLevel';

interface UserLevelBadgeProps {
  level?: UserLevel;
  className?: string;
}

export function UserLevelBadge({ level, className = '' }: UserLevelBadgeProps) {
  const levelInfo = getUserLevelInfo(level);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-lg leading-none">{levelInfo.emoji}</span>
      <span className="text-sm text-muted-foreground">
        Lv {levelInfo.level} {levelInfo.name}
      </span>
    </div>
  );
}
