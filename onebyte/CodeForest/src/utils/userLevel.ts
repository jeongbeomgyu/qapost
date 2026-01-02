export type UserLevel = 1 | 2 | 3 | 4 | 5;

export interface LevelInfo {
  level: UserLevel;
  name: string;
  emoji: string;
}

export const USER_LEVELS: Record<UserLevel, LevelInfo> = {
  1: { level: 1, name: '새싹', emoji: '🌱' },
  2: { level: 2, name: '묘목', emoji: '🌿' },
  3: { level: 3, name: '숲지기', emoji: '🌳' },
  4: { level: 4, name: '숲의 수호자', emoji: '🛡️' },
  5: { level: 5, name: '숲의 정령', emoji: '✨' },
};

export function getUserLevelInfo(level?: UserLevel): LevelInfo {
  if (!level || level < 1 || level > 5) {
    return USER_LEVELS[1]; // Default to level 1
  }
  return USER_LEVELS[level];
}

export function formatLevel(level?: UserLevel): string {
  const info = getUserLevelInfo(level);
  return `Lv ${info.level} ${info.emoji} ${info.name}`;
}
