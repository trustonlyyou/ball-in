export const POSITIONS = ["G", "F", "C"] as const;
export type Position = (typeof POSITIONS)[number];

export type Player = {
  id: string;
  name: string;
  number: string;
  positions: Position[];
  heightCm?: number;
  birthDate?: string; // YYYY-MM-DD
  isElite: boolean; // 선출
  photoUrl?: string;
};

export type Tournament = {
  id: string;
  name: string;
};

export type Game = {
  id: string;
  tournamentId: string;
  date: string; // YYYY-MM-DD
  opponent: string;
  round?: string;
  venue?: string;
  youtubeUrl?: string;
  opponentScore: number;
  isComplete: boolean;
};

export type EventType =
  | "fg2_made" | "fg2_miss" | "fg3_made" | "fg3_miss" | "ft_made" | "ft_miss"
  | "oreb" | "dreb" | "stl" | "blk" | "tov" | "pf";

/** 경기 중 기록 하나 (game_events 테이블) */
export type GameEvent = {
  id: string;
  gameId: string;
  playerId: string;
  type: EventType;
  shotKind?: "layup" | "post" | "mid";
  assistPlayerId?: string;
  videoTs?: number;
  quarter?: number;
};

/** 한 경기에서 선수 한 명의 기록. game_events 를 집계해서 만든다. */
export type BoxScoreLine = {
  playerId: string;
  fgm: number; // 야투 성공 (3점 포함)
  fga: number; // 야투 시도 (3점 포함)
  tpm: number; // 3점 성공
  tpa: number; // 3점 시도
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
};
