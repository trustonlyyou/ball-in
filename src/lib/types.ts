export type Player = {
  id: string;
  name: string;
  number: string;
  position?: string;
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

/** 한 경기에서 선수 한 명의 기록. 득점·리바운드는 저장하지 않고 계산한다. */
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
