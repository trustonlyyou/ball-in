import type { EventType, GameEvent } from "./types";

export const EVENT_LABEL: Record<EventType, string> = {
  fg2_made: "2점 성공",
  fg2_miss: "2점 실패",
  fg3_made: "3점 성공",
  fg3_miss: "3점 실패",
  ft_made: "자유투 성공",
  ft_miss: "자유투 실패",
  oreb: "공격 리바운드",
  dreb: "수비 리바운드",
  stl: "스틸",
  blk: "블락",
  tov: "턴오버",
  pf: "파울",
};

export const SHOT_KIND_LABEL = { layup: "레이업", post: "골밑슛", mid: "미들슛" } as const;

export const EVENT_POINTS: Partial<Record<EventType, number>> = { fg2_made: 2, fg3_made: 3, ft_made: 1 };

export const eventLabel = (e: Pick<GameEvent, "type" | "shotKind">) =>
  e.type === "fg2_made" && e.shotKind ? `${SHOT_KIND_LABEL[e.shotKind]} 성공` : EVENT_LABEL[e.type];

export const quarterLabel = (q?: number) => (q === undefined ? "-" : q <= 4 ? `${q}Q` : `OT${q - 4}`);
